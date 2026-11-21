// What every mode fixture shares: a server for the fixture site, as `vite dev`
// serves it or as a production build, a browser page that collects console
// problems, and checks that print one line each. A fixture is a script that
// exits 1 when a check fails:
//
//   node tests/modes/<fixture>.mjs [dev|prod]
//
// The site answers `/p/<page>?render=ssr|stream|client&roots=<n>`: `ssr` sends
// the page rendered by Octane's renderToString, once per root, each root with
// its own identifier prefix as @octanejs/astro gives islands; `stream` sends
// one root as renderToReadableStream writes it, whose late content waits
// `delay` ms, and with `early` runs the client script before the stream ends;
// `client` sends empty roots. `site/entry-client.ts` mounts them.
import { createServer as createHttpServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { build, createServer as createViteServer } from "vite"
import { chromium } from "playwright"

const here = fileURLToPath(new URL(".", import.meta.url))
const configFile = join(here, "vite.config.ts")
const dist = join(here, "../../.modes-dist")
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" }

export const mode = process.argv[2] === "prod" ? "prod" : "dev"
// The site's port, and the one after it for Vite's hot-update socket.
const port = Number(process.env.MODES_PORT ?? 4440)

function page(template, htmls, prefixes) {
  const roots = prefixes
    .map((prefix, index) => `<div data-root="${prefix}">${htmls?.[index] ?? ""}</div>`)
    .join("")
  return template.replace("<!--roots-->", roots)
}

async function listen(handler, port) {
  const server = createHttpServer((request, response) => {
    handler(request, response).catch((error) => {
      response.statusCode = 500
      response.end(String(error?.stack ?? error))
    })
  })
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve))
  return server
}

// Answers `/p/<page>`, or returns false for anything else.
async function answerPage(request, response, template, server) {
  const url = new URL(request.url ?? "/", "http://localhost")
  if (!url.pathname.startsWith("/p/")) return false
  const name = url.pathname.slice(3)
  const count = Number(url.searchParams.get("roots") ?? 1)
  const prefixes = Array.from({ length: count }, (_, index) => `o${index}`)
  const render = url.searchParams.get("render")
  let html = await template(url.pathname)
  if (url.searchParams.has("early")) html = html.replace('<script type="module"', '<script async type="module"')
  response.setHeader("content-type", "text/html")
  if (render !== "stream") {
    const htmls = render === "ssr" ? await server.render(name, prefixes) : undefined
    response.end(page(html, htmls, prefixes))
    return true
  }
  const [head, tail] = page(html, ["<!--stream-->"], ["o0"]).split("<!--stream-->")
  response.write(head)
  const stream = await server.stream(name, "o0", { delay: Number(url.searchParams.get("delay") ?? 30) })
  for await (const chunk of stream) response.write(chunk)
  response.end(tail)
  return true
}

/** Starts the fixture site and returns its origin, its Vite server in dev, and `close`. */
export async function startSite() {
  if (mode === "dev") {
    const vite = await createViteServer({
      configFile,
      server: { middlewareMode: true, hmr: { port: port + 1 } },
    })
    const server = await listen(async (request, response) => {
      const answered = await answerPage(
        request,
        response,
        async (path) =>
          vite.transformIndexHtml(path, await readFile(join(here, "site/index.html"), "utf8")),
        {
          render: async (name, prefixes) =>
            (await vite.ssrLoadModule("/entry-server.ts")).render(name, prefixes),
          stream: async (name, prefix, props) =>
            (await vite.ssrLoadModule("/entry-server.ts")).stream(name, prefix, props),
        }
      )
      if (!answered) vite.middlewares(request, response)
    }, port)
    return {
      origin: `http://127.0.0.1:${port}`,
      vite,
      close: async () => {
        await vite.close()
        server.close()
      },
    }
  }
  await build({ configFile, logLevel: "error", build: { outDir: join(dist, "client"), emptyOutDir: true } })
  await build({
    configFile,
    logLevel: "error",
    build: { ssr: "entry-server.ts", outDir: join(dist, "server"), emptyOutDir: true },
  })
  const built = await import(pathToFileURL(join(dist, "server/entry-server.js")).href)
  const template = await readFile(join(dist, "client/index.html"), "utf8")
  const server = await listen(async (request, response) => {
    if (await answerPage(request, response, async () => template, built)) return
    const path = new URL(request.url ?? "/", "http://localhost").pathname
    try {
      const body = await readFile(join(dist, "client", path))
      response.setHeader("content-type", types[extname(path)] ?? "application/octet-stream")
      response.end(body)
    } catch {
      response.statusCode = 404
      response.end()
    }
  }, port)
  return { origin: `http://127.0.0.1:${port}`, vite: undefined, close: async () => server.close() }
}

/** Checks that print as they are made, and the exit code they add up to. */
export function createChecks(title) {
  let failed = 0
  console.log(`# ${title} (${mode})`)
  return {
    check(name, ok, detail = "") {
      if (!ok) failed++
      console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`)
    },
    // A finding that is not the adapter's to pass or fail.
    note(text) {
      console.log(`note ${text}`)
    },
    done() {
      console.log(failed ? `${failed} failed` : "all passed")
      process.exitCode = failed ? 1 : 0
    },
  }
}

/**
 * Runs `drive` with the site, a browser and a way to open pages that collect
 * every console warning, console error and uncaught error into `problems`.
 */
export async function withSite(title, drive) {
  const checks = createChecks(title)
  const site = await startSite(port)
  const browser = await chromium.launch()
  try {
    // Waits until every root has rendered once, unless the page holds its
    // start or runs no script.
    const open = async (path, { javaScript = true, wait = "load" } = {}) => {
      const context = await browser.newContext({ javaScriptEnabled: javaScript })
      const page = await context.newPage()
      const problems = []
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type()))
          problems.push(`${message.type()}: ${message.text()}`)
      })
      page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`))
      await page.goto(site.origin + path, { waitUntil: wait })
      if (javaScript && wait === "load" && !path.includes("hold"))
        await page.waitForSelector("html[data-mounted]")
      return { page, problems }
    }
    await drive({ ...checks, site, open })
  } catch (error) {
    checks.check("fixture ran to its end", false, String(error?.stack ?? error).split("\n").slice(0, 4).join(" | "))
  } finally {
    await browser.close()
    await site.close()
    checks.done()
  }
}

/** Every element under the roots, as its tag and attributes in order. */
export const describeDom = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-root] *")].map(
      (el) =>
        el.tagName.toLowerCase() +
        [...el.attributes]
          .map((attribute) => ` ${attribute.name}="${attribute.value}"`)
          .sort()
          .join("") +
        (el.children.length ? "" : ` | ${el.textContent}`)
    )
  )
