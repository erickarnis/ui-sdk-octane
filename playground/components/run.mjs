// Serves the component pages from Vite's dev server, then from a production
// build, and drives each with drive.mjs:
//   pnpm test:components
import { spawn, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const config = fileURLToPath(new URL("./vite.config.ts", import.meta.url))
const drive = fileURLToPath(new URL("./drive.mjs", import.meta.url))
const vite = fileURLToPath(new URL("../../node_modules/vite/bin/vite.js", import.meta.url))

const port = Number(process.env.COMPONENTS_PORT ?? 4431)

async function ready(url) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`${url} never answered`)
}

async function lane(name, args, url) {
  const server = spawn(process.execPath, [vite, ...args, "--config", config], { stdio: "ignore" })
  try {
    await ready(url)
    const run = spawnSync(process.execPath, [drive, url], {
      stdio: "inherit",
      env: name === "dev" ? { ...process.env, COMPONENTS_WARM: "1" } : process.env,
    })
    console.log(`${run.status === 0 ? "ok  " : "FAIL"} components (${name})`)
    return run.status === 0
  } finally {
    server.kill("SIGTERM")
  }
}

const dev = await lane("dev", [], `http://127.0.0.1:${port}/`)
const built = spawnSync(process.execPath, [vite, "build", "--config", config], { stdio: "ignore" })
const prod = built.status === 0 && (await lane("prod", ["preview"], `http://127.0.0.1:${port + 1}/`))
process.exitCode = dev && prod ? 0 : 1
