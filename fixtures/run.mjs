// Proves the package works installed: packs it, installs the tarball into a
// copy of each consumer fixture, and checks the consumer in a headless browser,
// from its development server and from a production build, on each Octane
// version asked for.
//
//   pnpm test:pack
//   pnpm test:pack --octane=0.25.0 --consumer=astro --pm=bun --keep
//
// --octane    Octane versions, comma separated      (OCTANE_VERSIONS, default below)
// --consumer  vite, astro or both                   (default both)
// --pm        pnpm, npm or bun installs the consumer (default pnpm)
// --port      first of the two ports used            (TEST_PACK_PORT, default 4420)
// --keep      leave the working directory in place
//
// The copies live outside the repository (TEST_PACK_DIR, default the system's
// temporary directory), so nothing above them can lend a manifest, a lockfile
// or a node_modules to the consumer.
import { spawn } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { drive } from "./drive.mjs"

const DEFAULT_OCTANE = "0.25.0"
const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.dirname(here)

const flags = new Map(
  process.argv.slice(2).map((arg) => {
    const [name, value] = arg.replace(/^--/, "").split("=")
    return [name, value ?? "true"]
  })
)
const list = (value) => value.split(",").map((item) => item.trim()).filter(Boolean)
const octaneVersions = list(flags.get("octane") ?? process.env.OCTANE_VERSIONS ?? DEFAULT_OCTANE)
const consumers = list(flags.get("consumer") ?? "vite,astro")
const packageManager = flags.get("pm") ?? "pnpm"
const basePort = Number(flags.get("port") ?? process.env.TEST_PACK_PORT ?? 4420)
const keep = flags.has("keep")

/**
 * Runs a command to its end. Its output is shown only when it fails, or when
 * the caller asks for it back.
 */
function run(command, args, { cwd = repo, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let output = ""
    child.stdout.on("data", (chunk) => (output += chunk))
    child.stderr.on("data", (chunk) => (output += chunk))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}\n${output}`))
    })
  })
}

const view = async (spec, field) =>
  JSON.parse(await run("npm", ["view", spec, field, "--json"]))

const canConnect = (port) =>
  new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" })
    socket.once("connect", () => (socket.destroy(), resolve(true)))
    socket.once("error", () => resolve(false))
  })

async function waitFor(condition, what, seconds) {
  const deadline = Date.now() + seconds * 1000
  while (Date.now() < deadline) {
    if (await condition()) return
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`timed out after ${seconds}s waiting for ${what}`)
}

/**
 * Starts a server and returns the function that stops it. The server gets its
 * own process group, so stopping it also stops what it started.
 */
async function serve(bin, args, cwd, port) {
  if (await canConnect(port)) throw new Error(`port ${port} is already in use`)
  const child = spawn(bin, args, {
    cwd,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  })
  let output = ""
  let exited = false
  child.stdout.on("data", (chunk) => (output += chunk))
  child.stderr.on("data", (chunk) => (output += chunk))
  child.on("close", () => (exited = true))
  const signal = (name) => {
    try {
      process.kill(-child.pid, name)
    } catch {
      // Already gone.
    }
  }
  const closed = async () => exited && !(await canConnect(port))
  const stop = async () => {
    signal("SIGTERM")
    await waitFor(closed, `port ${port} to close`, 5).catch(() => signal("SIGKILL"))
    await waitFor(closed, `port ${port} to close`, 20)
  }
  try {
    await waitFor(
      async () => {
        if (exited) throw new Error(`${path.basename(bin)} exited early`)
        return canConnect(port)
      },
      `${path.basename(bin)} on port ${port}`,
      120
    )
  } catch (error) {
    await stop().catch(() => {})
    throw new Error(`${error.message}\n${output}`)
  }
  return stop
}

// How each consumer serves development and a production build, and the pages
// to check: Astro mounts the same app once in the browser only (`client:only`)
// and once rendered on the server and hydrated (`client:load`).
const servers = {
  vite: {
    pages: ["/"],
    dev: (port) => ["vite", ["--port", port, "--strictPort", "--host", "127.0.0.1"]],
    build: ["vite", ["build"]],
    preview: (port) => ["vite", ["preview", "--port", port, "--strictPort", "--host", "127.0.0.1"]],
  },
  astro: {
    pages: ["/", "/ssr"],
    // --ignore-lock keeps each server in the foreground, which Astro leaves
    // when it detects that an agent started it.
    dev: (port) => ["astro", ["dev", "--port", port, "--host", "127.0.0.1", "--ignore-lock"]],
    build: ["astro", ["build"]],
    preview: (port) => ["astro", ["preview", "--port", port, "--host", "127.0.0.1", "--ignore-lock"]],
  },
}

const installs = {
  pnpm: ["pnpm", ["install", "--ignore-workspace"]],
  npm: ["npm", ["install", "--no-audit", "--no-fund"]],
  bun: ["bun", ["install"]],
}

/**
 * The versions that go with one Octane version: the parser its compiler
 * loads, and the @octanejs/astro release whose peer range names its minor.
 */
async function companions(octane) {
  const peers = await view(`octane@${octane}`, "peerDependencies")
  const [, minor] = octane.split(".")
  const astroPeers = await view("@octanejs/astro", "versions").then((versions) =>
    Promise.all(
      versions.slice(-12).map(async (version) => ({
        version,
        range: await view(`@octanejs/astro@${version}`, "peerDependencies.octane"),
      }))
    )
  )
  const astro = astroPeers.findLast(({ range }) => range === `^0.${minor}.0`)
  return { "@tsrx/oxc": peers["@tsrx/oxc"], "@octanejs/astro": astro?.version }
}

async function prepare(consumer, octane, versions, tarball, work) {
  const dir = path.join(work, `${consumer}-octane-${octane}`)
  await cp(path.join(here, `consumer-${consumer}`), dir, { recursive: true })
  await cp(tarball, path.join(dir, "ui-sdk-octane.tgz"))
  const manifestPath = path.join(dir, "package.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  for (const group of [manifest.dependencies, manifest.devDependencies]) {
    if ("octane" in group) group.octane = octane
    for (const [name, version] of Object.entries(versions)) {
      if (name in group) {
        if (!version) throw new Error(`no ${name} release found for octane ${octane}`)
        group[name] = version
      }
    }
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  const [command, args] = installs[packageManager]
  await run(command, args, { cwd: dir })

  // What was asked for is what is installed, and the adapter is the tarball's
  // copy, not a link back to this repository.
  const installed = async (name) =>
    JSON.parse(await readFile(path.join(dir, "node_modules", name, "package.json"), "utf8")).version
  if ((await installed("octane")) !== octane) {
    throw new Error(`octane ${await installed("octane")} was installed, not ${octane}`)
  }
  const adapter = await realpath(path.join(dir, "node_modules", "ui-sdk-octane"))
  if (!adapter.startsWith(await realpath(dir))) {
    throw new Error(`ui-sdk-octane resolved outside the consumer: ${adapter}`)
  }
  return dir
}

const rows = []
async function step(row, name, action) {
  process.stdout.write(`  ${name} … `)
  const started = Date.now()
  try {
    const lines = (await action()) ?? []
    row[name] = "pass"
    console.log(`pass (${((Date.now() - started) / 1000).toFixed(1)}s)`)
    for (const line of lines) console.log("    " + line)
    return true
  } catch (error) {
    row[name] = "FAIL"
    console.log("FAIL")
    console.log(String(error?.message ?? error).replace(/^/gm, "    "))
    return false
  }
}

/** Serves, checks each page, and stops the server whatever the checks found. */
async function browse([bin, args], pages, dir, port) {
  const stop = await serve(bin, args, dir, port)
  try {
    const report = []
    let allOk = true
    for (const page of pages) {
      const { ok, lines } = await drive(`http://127.0.0.1:${port}${page}`)
      allOk &&= ok
      report.push(`${page}: ${ok ? `${lines.length} checks pass` : "\n" + lines.join("\n")}`)
    }
    if (!allOk) throw new Error(report.join("\n"))
    return report
  } finally {
    await stop()
  }
}

const base = process.env.TEST_PACK_DIR ?? os.tmpdir()
await mkdir(base, { recursive: true })
const work = await mkdtemp(path.join(base, "ui-sdk-octane-pack-"))
console.log(`working in ${work}`)

// `pnpm pack` runs prepack, which builds the declarations the tarball carries.
await run("pnpm", ["pack", "--pack-destination", work])
const tarball = path.join(work, (await readdir(work)).find((file) => file.endsWith(".tgz")))
console.log(`packed ${path.basename(tarball)}`)

for (const octane of octaneVersions) {
  const versions = await companions(octane)
  for (const consumer of consumers) {
    const row = { consumer, octane }
    rows.push(row)
    console.log(`\n${consumer}, octane ${octane}, installed with ${packageManager}`)
    let dir
    const bin = (name) => path.join(dir, "node_modules", ".bin", name)
    const command = ([name, args]) => [bin(name), args.map(String)]
    if (!(await step(row, "install", async () => void (dir = await prepare(consumer, octane, versions, tarball, work))))) {
      continue
    }
    // The consumer's own strict compile: the package's types come from the
    // tarball's declarations.
    await step(row, "types", () => run(bin("tsc"), ["--noEmit"], { cwd: dir }).then(() => []))
    const { pages } = servers[consumer]
    await step(row, "development", () =>
      browse(command(servers[consumer].dev(basePort)), pages, dir, basePort)
    )
    if (await step(row, "build", () => run(...command(servers[consumer].build), { cwd: dir }).then(() => []))) {
      await step(row, "production", () =>
        browse(command(servers[consumer].preview(basePort + 1)), pages, dir, basePort + 1)
      )
    } else {
      row.production = "FAIL"
    }
  }
}

console.log("")
console.table(rows)
if (keep) console.log(`kept ${work}`)
else await rm(work, { recursive: true, force: true })
process.exit(rows.some((row) => Object.values(row).includes("FAIL")) ? 1 : 0)
