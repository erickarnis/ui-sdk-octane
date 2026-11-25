// Fetches the part of UI SDK's repository the conformance run needs: its
// Playwright specs and the playground fixtures they open, at the commit that
// released the @ui-sdk/core version this package is pinned to. Nothing from
// it is committed here; it lands in `.upstream/`, which Git ignores.
//
//   node conformance/upstream.mjs
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

/** "chore: version packages (beta) (#1049)", which published 0.1.0-beta.17. */
export const commit = "d850982bd8aed202e07009825c3d9daf643fa24e"
export const upstream = fileURLToPath(new URL("../.upstream/", import.meta.url))

const git = (...args) =>
  execFileSync("git", args, { cwd: upstream, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim()

/** The checked-out commit, or nothing in a fresh clone, where rev-parse exits 1. */
function head() {
  try {
    return git("rev-parse", "--verify", "-q", "HEAD^{commit}")
  } catch {
    return undefined
  }
}

export function fetchUpstream() {
  if (!existsSync(upstream + ".git")) {
    mkdirSync(upstream, { recursive: true })
    git("init", "-q")
    git("remote", "add", "origin", "https://github.com/vercel-labs/ui")
    git("sparse-checkout", "init", "--cone")
    git("sparse-checkout", "set", "tests", "apps/playground")
  }
  if (head() !== commit) {
    git("fetch", "--depth", "1", "--filter=blob:none", "origin", commit)
    git("checkout", "-q", "FETCH_HEAD")
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchUpstream()
  console.log(`UI SDK ${commit.slice(0, 7)} is in .upstream/`)
}
