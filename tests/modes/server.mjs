// Server rendering alone, in Node with no DOM: every Octane server renderer
// over the fixture pages, against each other and against what core's own
// server check renders for the same parts.
//
//   node tests/modes/server.mjs [dev|prod]
//
// It runs itself again under Octane's compiler hook, with NODE_ENV set before
// Octane loads, which is what picks its development or production build.
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const mode = process.argv[2] === "prod" ? "prod" : "dev"
if (!process.env.MODES_SERVER_CHILD) {
  const child = spawnSync(
    process.execPath,
    ["--expose-gc", "--import", "octane/compiler/register", fileURLToPath(import.meta.url), mode],
    {
      stdio: "inherit",
      timeout: 120_000,
      env: {
        ...process.env,
        MODES_SERVER_CHILD: "1",
        NODE_ENV: mode === "prod" ? "production" : "development",
      },
    }
  )
  // A child that is still running after its checks left a timer behind.
  if (child.error) console.log(`FAIL the script exits by itself — ${child.error.message}`)
  process.exit(child.status ?? 1)
}

const { createChecks } = await import("./harness.mjs")
const { check, note, done } = createChecks("server rendering")

// Every read of a browser global, with the file that read it. Core asks
// `typeof window` and `typeof document` to learn where it runs, which is not
// a use; a read from the adapter's own files would be.
const reads = new Set()
for (const name of ["document", "window", "localStorage", "sessionStorage", "matchMedia", "location"]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    get() {
      const frame = new Error().stack?.split("\n")[2] ?? ""
      reads.add(`${name} from ${/([\w.-]+\/[\w.-]+\.[jt]sx?):\d+/.exec(frame)?.[1] ?? "?"}`)
      return undefined
    },
  })
}
const adapterReads = () => [...reads].filter((read) => /from (src|site|pages)\//.test(read))

const { renderToPipeableStream, renderToReadableStream, renderToStaticMarkup, renderToString } =
  await import("octane/server")
const { prerender } = await import("octane/static")
const { checkServer } = await import("@ui-sdk/core/testing")
const { tabs } = await import("@ui-sdk/core/tabs")
const { PassThrough } = await import("node:stream")
const { Page } = await import("./site/pages/basic.tsx")
const { Page: Streamed } = await import("./site/pages/streamed.tsx")
const { Page: Hidden } = await import("./site/pages/activity.tsx")
const { muteButton, probeLog, rating } = await import("./site/parts.ts")

const options = { identifierPrefix: "o0" }
const html = renderToString(Page, {}, options).html
check("renderToString renders the parts with no DOM", html.includes('aria-pressed="true"') && html.includes('role="tabpanel"'))
check("the adapter reads no browser global to import or render", adapterReads().length === 0, adapterReads().join(", "))
check("a second render is the same HTML", renderToString(Page, {}, options).html === html)
check("prerender is the same HTML", (await prerender(Page, {}, options)).html === html)
const readable = await new Response(await renderToReadableStream(Page, {}, options)).text()
check("renderToReadableStream is the same HTML", readable === html)
const piped = await new Promise((resolve, reject) => {
  const chunks = []
  const sink = new PassThrough()
  sink.on("data", (chunk) => chunks.push(chunk))
  sink.on("end", () => resolve(Buffer.concat(chunks).toString()))
  renderToPipeableStream(Page, {}, { ...options, onShellError: reject }).pipe(sink)
})
check("renderToPipeableStream is the same HTML", piped === html)
const withoutMarkers = (text) => text.replace(/<!--.*?-->/g, "")
check(
  "renderToStaticMarkup is the same HTML without hydration markers",
  renderToStaticMarkup(Page, {}, options).html === withoutMarkers(html)
)

// Every element as its tag and sorted attributes, with instance ids, which
// each renderer makes its own way, replaced.
const elements = (text) =>
  [...withoutMarkers(text).matchAll(/<([a-z]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*>/g)].map(
    ([, tag, attributes]) =>
      tag +
      [...attributes.matchAll(/([\w-]+)(?:="([^"]*)")?/g)]
        .map(([, name, value = ""]) => ` ${name}="${value.replace(/ui-sdk-:o0in-\w+:|server-\d+/g, "ID")}"`)
        .sort()
        .join("")
  )
// The parts of one primitive, without what only the page's markup gives them.
const section = (text, slot) =>
  elements(text)
    .filter((line) => line.includes(`data-slot="${slot}`))
    .map((line) => line.replace(/ (id|class|aria-label)="(?!ID)[^"]*"/g, ""))
const compare = (name, slot, mine, cores) => {
  const a = section(mine, slot)
  const b = section(cores, slot)
  const differing = a.filter((line, index) => line !== b[index])
  check(name, a.length > 0 && a.length === b.length && differing.length === 0, differing.length ? `\n    octane: ${differing[0]}\n    core:   ${b[a.indexOf(differing[0])]}` : `${a.length} parts`)
}
compare(
  "tabs attributes match core's checkServer",
  "tabs",
  html,
  checkServer(tabs, { defaultValue: "b" }, `<root><list><tab value="a">Alpha</tab><tab value="b">Beta</tab><tab value="c" as="a" href="#c" data-custom="yes">Gamma</tab></list><panel value="a">A</panel><panel value="b">B</panel><panel value="c">C</panel></root>`)
)
compare(
  "rating attributes match core's checkServer",
  "rating",
  html,
  checkServer(rating, { value: 4 }, `<root>${["1", "2", "3", "4", "5"].map((value) => `<star value="${value}">★</star>`).join("")}</root>`)
)
const controlled = /<button id="cmute"[^>]*>/.exec(html)?.[0] ?? ""
compare("a controlled part's attributes match core's checkServer", "mute-button", controlled, checkServer(muteButton, { muted: true }, `<root>Unmute</root>`))

// Prefixes keep two roots' ids apart, as @octanejs/astro gives each island its own.
const idsOf = (text) => [...text.matchAll(/ id="([^"]*:[^"]*)"/g)].map(([, id]) => id)
const other = renderToString(Page, {}, { identifierPrefix: "o1" }).html
check("ids carry the root's prefix", idsOf(html).length > 0 && idsOf(html).every((id) => id.includes(":o0in-")), idsOf(html).slice(0, 2).join(" "))
check("two prefixes share no id", idsOf(other).every((id) => !idsOf(html).includes(id)))

// A streamed boundary: the parts inside arrive in a later segment.
const shell = renderToString(Streamed, {}, options).html
check("renderToString leaves a suspended boundary to its fallback", shell.includes("late-fallback") && !shell.includes("late-tabs") && shell.includes('id="after"'))
// A late segment travels as JSON text inside a script.
const streamed = (await new Response(await renderToReadableStream(Streamed, { delay: 20 }, options)).text())
  .replace(/\\u003c/gi, "<")
  .replace(/\\"/g, '"')
check("a stream sends the parts inside a boundary once it resolves", streamed.includes('id="late-tabs"') && streamed.includes('role="tabpanel"') && streamed.includes("waited for"))
const whole = (await prerender(Streamed, { delay: 5 }, options)).html
check("prerender waits for them", whole.includes('id="late-tabs"') && !whole.includes("late-fallback"))
const streamedIds = idsOf(streamed)
check("ids inside a streamed boundary are unique", new Set(streamedIds).size === streamedIds.length && streamedIds.length >= 3, streamedIds.join(" "))

// Hidden <Activity> content is not rendered on a server at all.
const hidden = renderToString(Hidden, {}, options).html
check("a hidden Activity's parts are left out of server HTML", hidden.includes('id="free"') && !hidden.includes('id="late"'))

// Nothing binds, nothing is kept, and what a render makes can be collected.
check("no part binds an element on a server", probeLog.bound === 0, JSON.stringify(probeLog))
check("the adapter read no browser global in any of it", adapterReads().length === 0, adapterReads().join(", "))
note(`core's own probes: ${[...reads].join(", ") || "none"}`)
// Core sweeps a render's parts in a microtask, so the loop lets them run.
const tick = () => new Promise((resolve) => setTimeout(resolve))
globalThis.gc()
const before = process.memoryUsage().heapUsed
for (let index = 0; index < 3000; index++) {
  renderToString(Page, {}, options)
  if (index % 50 === 0) await tick()
}
await tick()
globalThis.gc()
const grown = (process.memoryUsage().heapUsed - before) / 1024 / 1024
check("3000 renders leave no instances behind", grown < 8, `heap grew ${grown.toFixed(1)} MB`)
note(`NODE_ENV=${process.env.NODE_ENV}; exiting without process.exit shows no timer was left running`)
done()
