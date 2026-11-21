// Runs UI SDK's own specs against this adapter and against @ui-sdk/react,
// then compares the two, test by test:
//
//   pnpm conformance                      everything
//   pnpm conformance menu tabs            the specs whose file matches
//   pnpm conformance --projects=octane,react   only the base projects
//   pnpm conformance --update             rewrite known.json from this run
//
// A test that fails here and passes on React is a gap in this adapter. Each
// one is listed in known.json with why, and the run fails on a gap that is
// not listed, or on a listed one that passes (so the list only ever shrinks
// on purpose). A test that fails on both is the harness's or the pinned
// versions' doing, and is reported without failing the run.
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
const skipBuild = args.includes("--no-build")
const projectsArg = args.find((arg) => arg.startsWith("--projects="))?.slice(11)
const filters = args.filter((arg) => !arg.startsWith("--"))
const variants = ["", "-data", "-portal", "-sheet"]
const projects = projectsArg
  ? projectsArg.split(",")
  : ["octane", "react"].flatMap((adapter) => variants.map((variant) => adapter + variant))

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
  }
}

const report = path.join(repo, "test-results/conformance-report.json")
mkdirSync(path.dirname(report), { recursive: true })
run(
  process.execPath,
  [playwright, "test", "--config", "playwright.config.ts", "--trace", "off", ...projects.map((p) => `--project=${p}`), ...filters],
  { CONFORMANCE_REPORT: report, CONFORMANCE_ADAPTERS: [...new Set(projects.map((p) => p.split("-")[0]))].join(",") }
)

// Every test's outcome by adapter, keyed by what the two share: the variant,
// the file and the title.
const outcomes = new Map()
function collect(suite, titles) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      const [adapter, variant = "base"] = test.projectName.split("-")
      const key = `${variant} › ${path.basename(spec.file)} › ${[...titles, spec.title].join(" › ")}`
      const entry = outcomes.get(key) ?? {}
      entry[adapter] = test.status === "skipped" ? "skipped" : test.status === "expected" ? "passed" : test.status === "flaky" ? "flaky" : "failed"
      outcomes.set(key, entry)
    }
  }
  for (const child of suite.suites ?? []) collect(child, child.file === child.title ? titles : [...titles, child.title])
}
for (const suite of JSON.parse(readFileSync(report, "utf8")).suites) collect(suite, [])

const count = { both: 0, gaps: [], shared: [], onlyOctane: [], flaky: [], skipped: 0 }
for (const [key, { octane, react }] of outcomes) {
  if (octane === "skipped" || octane === undefined) count.skipped++
  else if (octane === "flaky") count.flaky.push(key)
  else if (octane === "passed" && react !== "failed") count.both++
  else if (octane === "passed") count.onlyOctane.push(key)
  else if (react === "failed") count.shared.push(key)
  else count.gaps.push(key)
}

const known = existsSync(knownFile) ? JSON.parse(readFileSync(knownFile, "utf8")) : {}
const ran = (key) => outcomes.has(key)
const unexpected = count.gaps.filter((key) => !(key in known))
const stale = Object.keys(known).filter((key) => ran(key) && !count.gaps.includes(key) && outcomes.get(key).octane !== "skipped")

console.log(`\n${count.both} pass on this adapter${projects.some((p) => p.startsWith("react")) ? " (and on React, where React ran)" : ""}`)
console.log(`${count.gaps.length} fail here and pass on React (${count.gaps.length - unexpected.length} known)`)
console.log(`${count.shared.length} fail on both, ${count.onlyOctane.length} fail only on React, ${count.flaky.length} flaky, ${count.skipped} skipped`)
const list = (title, keys) => keys.length && console.log(`\n${title}\n${keys.map((key) => "  " + key).join("\n")}`)
list("Gaps not in known.json:", unexpected)
list("In known.json but passing now:", stale)
list("Fail on both adapters:", count.shared)
list("Fail on React only:", count.onlyOctane)

if (update) {
  const next = Object.fromEntries(
    [...Object.entries(known).filter(([key]) => !ran(key) || count.gaps.includes(key)), ...unexpected.map((key) => [key, "unexplained"])].sort(([a], [b]) => a.localeCompare(b))
  )
  writeFileSync(knownFile, JSON.stringify(next, null, 2) + "\n")
  console.log(`\nknown.json now lists ${Object.keys(next).length} gaps.`)
} else process.exitCode = unexpected.length || stale.length ? 1 : 0
