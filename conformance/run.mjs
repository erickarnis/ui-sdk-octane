// Runs UI SDK's own specs against this adapter:
//
//   pnpm conformance                 every variant, on this adapter
//   pnpm conformance menu tabs       the specs whose file matches
//   pnpm conformance --oracle        also on @ui-sdk/react, to tell whose a failure is
//   pnpm conformance --projects=octane,octane-ssr
//   pnpm conformance --update        rewrite known.json from this run
//   pnpm conformance --no-build      reuse the pages built last time
//
// The run fails on a test that fails here and is not in known.json, and on
// one that is listed there and passes, so the list only ever shrinks on
// purpose. known.json gives each listed test its reason.
//
// With --oracle the same specs run on @ui-sdk/react too, and a failure is
// reported as this adapter's (React passes) or as shared (React fails as
// well: the harness's or the pinned versions' doing). That is how an entry
// earns its reason.
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { fetchUpstream } from "./upstream.mjs"

const here = fileURLToPath(new URL(".", import.meta.url))
const repo = path.dirname(here.replace(/\/$/, ""))
const knownFile = path.join(here, "known.json")
const args = process.argv.slice(2)
const update = args.includes("--update")
const oracle = args.includes("--oracle")
const skipBuild = args.includes("--no-build")
const projectsArg = args.find((arg) => arg.startsWith("--projects="))?.slice(11)
const filters = args.filter((arg) => !arg.startsWith("--"))
const variants = ["", "-data", "-portal", "-sheet", "-ssr"]
const adapters = oracle ? ["octane", "react"] : ["octane"]
const projects = projectsArg
  ? projectsArg.split(",")
  : adapters.flatMap((adapter) => variants.map((variant) => adapter + variant))

const run = (command, commandArgs, env = {}) =>
  spawnSync(command, commandArgs, {
    cwd: here,
    stdio: "inherit",
    env: { ...process.env, ...env },
  })
const vite = path.join(repo, "node_modules/vite/bin/vite.js")
const playwright = path.join(repo, "node_modules/@playwright/test/cli.js")

fetchUpstream()
if (!skipBuild) {
  for (const adapter of ["octane", "react"]) {
    if (!projects.some((project) => project.startsWith(adapter))) continue
    // A development build: bundled, with the SDK's development checks on, as
    // upstream's own runs use.
    const built = run(process.execPath, [vite, "build", "--config", "vite.config.ts", "--logLevel", "error"], {
      CONFORMANCE_ADAPTER: adapter,
      NODE_ENV: "development",
    })
    if (built.status !== 0) process.exit(built.status ?? 1)
    // Octane's -ssr fixtures take their HTML from a server build of the
    // fixtures, which the preview server's /__ssr route renders.
    if (adapter !== "octane" || !projects.includes("octane-ssr")) continue
    const server = run(process.execPath, [vite, "build", "--ssr", "--config", "vite.config.ts", "--logLevel", "error"], {
      CONFORMANCE_ADAPTER: adapter,
      NODE_ENV: "development",
    })
    if (server.status !== 0) process.exit(server.status ?? 1)
  }
}

const report = path.join(repo, "test-results/conformance-report.json")
mkdirSync(path.dirname(report), { recursive: true })
run(
  process.execPath,
  [
    playwright,
    "test",
    "--config",
    "playwright.config.ts",
    "--trace",
    "off",
    // Drags, flicks and animations are timed, and a busy machine fails one
    // now and then. A test that passes on a retry is reported as flaky.
    "--retries=2",
    ...projects.map((project) => `--project=${project}`),
    ...filters,
  ],
  {
    CONFORMANCE_REPORT: report,
    CONFORMANCE_ADAPTERS: [...new Set(projects.map((project) => project.split("-")[0]))].join(","),
  }
)

// Every test's outcome by adapter, keyed by what the two share: the variant,
// the file and the title.
const outcomes = new Map()
const status = { skipped: "skipped", expected: "passed", flaky: "flaky" }
function collect(suite, titles) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      const [adapter, variant = "base"] = test.projectName.split("-")
      const key = `${variant} › ${path.basename(spec.file)} › ${[...titles, spec.title].join(" › ")}`
      const entry = outcomes.get(key) ?? {}
      entry[adapter] = status[test.status] ?? "failed"
      outcomes.set(key, entry)
    }
  }
  for (const child of suite.suites ?? [])
    collect(child, child.file === child.title ? titles : [...titles, child.title])
}
for (const suite of JSON.parse(readFileSync(report, "utf8")).suites) collect(suite, [])

const count = { passed: 0, skipped: 0, flaky: [], failed: [] }
for (const [key, { octane }] of outcomes) {
  if (octane === undefined) continue
  if (octane === "skipped") count.skipped++
  else if (octane === "failed") count.failed.push(key)
  else {
    count.passed++
    if (octane === "flaky") count.flaky.push(key)
  }
}

const known = existsSync(knownFile) ? JSON.parse(readFileSync(knownFile, "utf8")) : {}
const onReact = (key) => outcomes.get(key)?.react
const unexpected = count.failed.filter((key) => !(key in known))
const stale = Object.keys(known).filter(
  (key) => ["passed", "flaky"].includes(outcomes.get(key)?.octane)
)
const whose = (key) =>
  onReact(key) === undefined
    ? ""
    : onReact(key) === "failed"
      ? "  (fails on @ui-sdk/react too)"
      : "  (passes on @ui-sdk/react: this adapter's)"

console.log(
  `\n${count.passed} passed, ${count.failed.length} failed (${count.failed.length - unexpected.length} in known.json), ${count.skipped} skipped, ${count.flaky.length} passed on a retry`
)
const list = (title, keys) =>
  keys.length && console.log(`\n${title}\n${keys.map((key) => `  ${key}${whose(key)}`).join("\n")}`)
list("Failed and not in known.json:", unexpected)
list("In known.json but passing now:", stale)
list("Passed on a retry:", count.flaky)

if (update) {
  const reason = (key) =>
    known[key] ??
    (onReact(key) === "failed"
      ? "Fails on @ui-sdk/react 0.1.0-beta.13 too."
      : "Unexplained.")
  const next = Object.fromEntries(
    [
      // Entries this run did not reach stay as they are.
      ...Object.keys(known).filter((key) => outcomes.get(key)?.octane === undefined),
      ...count.failed,
    ]
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, reason(key)])
  )
  writeFileSync(knownFile, JSON.stringify(next, null, 2) + "\n")
  console.log(`\nknown.json now lists ${Object.keys(next).length} tests.`)
} else process.exitCode = unexpected.length || stale.length ? 1 : 0
