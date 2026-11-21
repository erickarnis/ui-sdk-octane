// Runs every mode fixture against a development and a production build:
//   pnpm test:modes
// Each fixture is a script of its own (see harness.mjs) that exits 1 when a
// check fails; this exits 1 when any did.
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const fixtures = ["server", "hydration", "strict", "activity", "islands", "transitions", "refs"]
let failed = 0
for (const fixture of fixtures) {
  for (const lane of ["dev", "prod"]) {
    const script = fileURLToPath(new URL(`./${fixture}.mjs`, import.meta.url))
    const run = spawnSync(process.execPath, [script, lane], { encoding: "utf8" })
    const lines = (run.stdout + run.stderr).split("\n")
    const passed = lines.filter((line) => line.startsWith("ok")).length
    if (run.status === 0) console.log(`ok   ${fixture} (${lane}): ${passed} checks`)
    else {
      failed++
      console.log(`FAIL ${fixture} (${lane})`)
      console.log(lines.filter((line) => line && !line.startsWith("ok")).join("\n"))
    }
  }
}
process.exitCode = failed ? 1 : 0
