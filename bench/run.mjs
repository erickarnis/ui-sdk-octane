// Times this adapter against @ui-sdk/react on the same fixtures, in
// production builds, in headless Chromium:
//
//   pnpm bench                          every scenario, 15 runs each
//   pnpm bench tabs select              the fixtures whose name matches
//   pnpm bench --runs=30 --label=mine   more runs; write bench/results/mine.json
//   pnpm bench --no-build               reuse the last builds
//   pnpm bench --profile=select/open    also profile one scenario on Octane
//   pnpm bench --profile=select/open --profile-only
//
// A run's time is the main thread's busy time from the start of the
// interaction until the page is idle again (Chromium's TaskDuration): script,
// style, layout and paint, with the frames and effects the interaction
// schedules, and none of the idle time between them. Renders are the calls of
// the fixture's class name functions, one per part render on both adapters;
// mutations are the DOM changes a MutationObserver sees.
import { spawnSync } from "node:child_process"
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const here = fileURLToPath(new URL(".", import.meta.url))
const repo = path.dirname(here.replace(/\/$/, ""))
const args = process.argv.slice(2)
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const runs = Number(option("runs", 15))
const warmup = Number(option("warmup", 3))
const label = option("label", "latest")
const profile = option("profile", undefined)
const profileOnly = args.includes("--profile-only")
const filters = args.filter((arg) => !arg.startsWith("--"))
// BENCH_PORT moves the two static servers, so two checkouts can run at once.
const port = Number(process.env.BENCH_PORT ?? 4496)

const fixtures = {
  tabs: ["react", "octane", "baseui"],
  switches: ["react", "octane"],
  popover: ["react", "octane"],
  select: ["react", "octane"],
  combobox: ["react", "octane"],
  elements: ["octane"],
  signals: ["octane"],
}
const builds = { react: "react", octane: "octane", baseui: "octane" }

function build(adapter, minify = true) {
  const result = spawnSync(
    process.execPath,
    [path.join(repo, "node_modules/vite/bin/vite.js"), "build", "--config", path.join(here, "vite.config.ts")],
    {
      cwd: repo,
      stdio: "inherit",
      env: { ...process.env, BENCH_ADAPTER: adapter, NODE_ENV: "production", BENCH_MINIFY: String(minify) },
    }
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!args.includes("--no-build")) for (const adapter of ["react", "octane"]) build(adapter)

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" }
function serve(dir, at) {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname
    const file = path.join(dir, pathname === "/" ? "bench/app/index.html" : pathname)
    if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) {
      response.statusCode = 404
      response.end()
      return
    }
    response.setHeader("content-type", types[path.extname(file)] ?? "application/octet-stream")
    createReadStream(file).pipe(response)
  })
  return new Promise((resolve) => server.listen(at, "127.0.0.1", () => resolve(server)))
}

const servers = {
  react: await serve(path.join(repo, ".bench-dist/react"), port),
  octane: await serve(path.join(repo, ".bench-dist/octane"), port + 1),
}
const origin = (variant) => `http://127.0.0.1:${builds[variant] === "react" ? port : port + 1}`

const browser = await chromium.launch()

async function open(fixture, variant) {
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  // A probe fixture reports what it found on the console.
  page.on("console", (message) => {
    if (message.text().startsWith("probe:")) console.log(`  ${fixture} ${variant} ${message.text()}`)
  })
  await page.goto(`${origin(variant)}/?fixture=${fixture}&variant=${variant}`)
  await page.waitForSelector("body[data-ready], body[data-missing]", { state: "attached" })
  if (await page.$("body[data-missing]")) throw new Error(`No ${fixture} fixture for ${variant}.`)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Performance.enable")
  return { page, cdp, errors }
}

// Waits until the page has done what the interaction scheduled: three frames,
// for positioning that measures over several, and a task after them.
const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const frame = (left) =>
          left ? requestAnimationFrame(() => frame(left - 1)) : setTimeout(resolve, 30)
        frame(3)
      })
  )

async function send(page, input) {
  if ("click" in input) {
    const box = await page.evaluate((selector) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    }, input.click)
    if (!box) throw new Error(`Nothing matches ${input.click}.`)
    // In view first, outside the timed part when it is setup.
    await page.mouse.click(box.x, box.y)
  } else if ("press" in input) await page.keyboard.press(input.press)
  else await page.keyboard.type(input.type)
}

async function busy(cdp) {
  const { metrics } = await cdp.send("Performance.getMetrics")
  const value = (name) => metrics.find((metric) => metric.name === name)?.value ?? 0
  return { task: value("TaskDuration"), script: value("ScriptDuration") }
}

const step = (page, scenario, which) =>
  page.evaluate(
    ([name, key]) => {
      const scenario = window.__bench.scenario(name)
      scenario[key]?.()
      return {
        setup: scenario.setup ?? [],
        input: scenario.input ?? null,
      }
    },
    [scenario, which]
  )

async function once({ page, cdp }, scenario, around = {}) {
  const { setup, input } = await step(page, scenario, "prepare")
  for (const each of setup) await send(page, each)
  await settle(page)
  // A click's target is scrolled into view and measured before the clock starts.
  if (input && "click" in input)
    await page.evaluate((selector) => document.querySelector(selector)?.scrollIntoView({ block: "center" }), input.click)
  await page.evaluate(() => window.__bench.counts())
  await around.start?.()
  const before = await busy(cdp)
  await step(page, scenario, "act")
  if (input) await send(page, input)
  await settle(page)
  const after = await busy(cdp)
  await around.stop?.()
  const counts = await page.evaluate(() => window.__bench.counts())
  await step(page, scenario, "reset")
  await settle(page)
  return {
    ms: (after.task - before.task) * 1000,
    scriptMs: (after.script - before.script) * 1000,
    ...counts,
  }
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
}
const summary = (samples) => {
  const ms = samples.map((sample) => sample.ms)
  return {
    median: median(ms),
    p25: quantile(ms, 0.25),
    p75: quantile(ms, 0.75),
    min: Math.min(...ms),
    scriptMedian: median(samples.map((sample) => sample.scriptMs)),
    renders: median(samples.map((sample) => sample.renders)),
    mutations: median(samples.map((sample) => sample.mutations)),
    runs: ms.length,
  }
}

const results = []
for (const [fixture, variants] of Object.entries(fixtures)) {
  if (profileOnly) break
  if (filters.length && !filters.some((filter) => fixture.includes(filter))) continue
  const pages = {}
  for (const variant of variants) pages[variant] = await open(fixture, variant)
  const names = await pages[variants[0]].page.evaluate(() => window.__bench.names)
  for (const scenario of names) {
    const samples = Object.fromEntries(variants.map((variant) => [variant, []]))
    // Variants take turns, so drift in the machine's speed lands on each alike.
    for (let run = 0; run < warmup + runs; run++)
      for (const variant of variants) {
        const sample = await once(pages[variant], scenario)
        if (run >= warmup) samples[variant].push(sample)
      }
    const row = { fixture, scenario, variants: {} }
    for (const variant of variants) row.variants[variant] = summary(samples[variant])
    results.push(row)
    console.log(format(row))
  }
  for (const variant of variants) {
    if (pages[variant].errors.length)
      console.log(`  ${variant} page errors: ${pages[variant].errors.join(" | ")}`)
    await pages[variant].page.close()
  }
}

function format({ fixture, scenario, variants }) {
  const cell = (stats) =>
    stats
      ? `${stats.median.toFixed(1).padStart(7)} ms [${stats.p25.toFixed(1)}–${stats.p75.toFixed(1)}] r${stats.renders} m${stats.mutations}`.padEnd(42)
      : "".padEnd(42)
  const ratio = variants.react && variants.octane ? (variants.octane.median / variants.react.median).toFixed(2) + "×" : ""
  return `${`${fixture} / ${scenario}`.padEnd(22)} ${cell(variants.react)} ${cell(variants.octane)} ${ratio.padStart(6)}  ${variants.baseui ? cell(variants.baseui) : ""}`
}

if (!profileOnly) {
  console.log(
    `\n${"".padEnd(22)} ${"@ui-sdk/react".padEnd(42)} ${"ui-sdk-octane".padEnd(42)} ${"o/r".padStart(6)}  @octanejs/base-ui`
  )
  for (const row of results) console.log(format(row))
  console.log(
    `\nMedian of ${runs} runs after ${warmup} warm-up runs, [25th–75th percentile], r: part renders, m: DOM mutations.`
  )
  mkdirSync(path.join(here, "results"), { recursive: true })
  const out = path.join(here, "results", `${label}.json`)
  writeFileSync(
    out,
    JSON.stringify(
      {
        label,
        date: new Date().toISOString(),
        runs,
        warmup,
        chromium: browser.version(),
        commit: spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: repo, encoding: "utf8" }).stdout.trim(),
        results,
      },
      null,
      2
    ) + "\n"
  )
  console.log(`Wrote ${path.relative(repo, out)}.`)
}

if (profile) {
  // An unminified build, so the profile names the functions.
  const [fixture, scenario] = profile.split("/")
  build("octane", false)
  const target = await open(fixture, "octane")
  for (let run = 0; run < warmup; run++) await once(target, scenario)
  await target.cdp.send("Profiler.enable")
  await target.cdp.send("Profiler.setSamplingInterval", { interval: 100 })
  // Only the timed part of each run is sampled.
  const self = new Map()
  const profiled = {
    start: () => target.cdp.send("Profiler.start"),
    async stop() {
      const { profile: cpu } = await target.cdp.send("Profiler.stop")
      const byId = new Map(cpu.nodes.map((node) => [node.id, node]))
      const deltas = cpu.timeDeltas ?? []
      cpu.samples.forEach((id, index) => {
        const { callFrame } = byId.get(id)
        if (["(idle)", "(program)", "(root)"].includes(callFrame.functionName)) return
        const file = callFrame.url
          .replace(/^.*?\/assets\//, "")
          .replace(/^.*node_modules\//, "")
          .replace(/^.*\/(src|bench)\//, "$1/")
        const key = `${callFrame.functionName || "(anonymous)"}  ${file}:${callFrame.lineNumber + 1}`
        self.set(key, (self.get(key) ?? 0) + (deltas[index + 1] ?? deltas[index] ?? 0) / 1000)
      })
    },
  }
  for (let run = 0; run < runs; run++) await once(target, scenario, profiled)
  const total = [...self.values()].reduce((sum, value) => sum + value, 0)
  console.log(`\nSelf time in ${profile} on Octane, ${runs} runs, ${total.toFixed(0)} ms sampled:`)
  const owners = new Map()
  for (const [key, ms] of self) {
    const where = key.split("  ")[1] ?? ""
    const owner = key.startsWith("(garbage collector)")
      ? "garbage collection"
      : where.startsWith("@ui-sdk/core")
        ? "@ui-sdk/core"
        : where.startsWith("octane/")
          ? "octane"
          : where.startsWith("src/")
            ? "this adapter (src/)"
            : where.startsWith(":")
              ? "the browser (DOM, style, layout)"
              : "other (fixture, harness)"
    owners.set(owner, (owners.get(owner) ?? 0) + ms)
  }
  for (const [owner, ms] of [...owners].sort((a, b) => b[1] - a[1]))
    console.log(`${((ms / total) * 100).toFixed(1).padStart(5)}%  ${(ms / runs).toFixed(2).padStart(7)} ms/run  ${owner}`)
  console.log("")
  for (const [key, ms] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 30))
    console.log(`${((ms / total) * 100).toFixed(1).padStart(5)}%  ${(ms / runs).toFixed(2).padStart(7)} ms/run  ${key}`)
  console.log("\nThis adapter's own functions:")
  for (const [key, ms] of [...self].filter(([key]) => (key.split("  ")[1] ?? "").startsWith(process.env.OWNER ?? "src/")).sort((a, b) => b[1] - a[1]).slice(0, 15))
    console.log(`${((ms / total) * 100).toFixed(1).padStart(5)}%  ${(ms / runs).toFixed(2).padStart(7)} ms/run  ${key}`)
  await target.page.close()
}

await browser.close()
for (const server of Object.values(servers)) server.close()
