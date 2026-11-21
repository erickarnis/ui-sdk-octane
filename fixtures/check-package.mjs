// Lints the tarball that would be published: publint reads its manifest and
// files, and attw checks that every export resolves to types. The package is
// ESM only and needs a bundler with Octane's compiler, so attw skips the
// resolution modes that only CommonJS and Node 10 use.
//
//   pnpm check:package
import { execFileSync } from "node:child_process"
import { mkdtempSync, readdirSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const work = mkdtempSync(path.join(process.env.TEST_PACK_DIR ?? os.tmpdir(), "ui-sdk-octane-check-"))
const run = (command, args) => execFileSync(command, args, { cwd: repo, stdio: "inherit" })
const bin = (name) => path.join(repo, "node_modules", ".bin", name)

try {
  run("pnpm", ["pack", "--pack-destination", work])
  const tarball = path.join(work, readdirSync(work).find((file) => file.endsWith(".tgz")))
  run(bin("publint"), [tarball, "--strict"])
  run(bin("attw"), [tarball, "--profile", "esm-only"])
} catch {
  // The failing tool has already printed why.
  process.exitCode = 1
} finally {
  rmSync(work, { recursive: true, force: true })
}
