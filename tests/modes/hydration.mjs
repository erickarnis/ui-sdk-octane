// Server rendering, then hydration: the server's HTML against the client's
// own render, the same elements before and after hydrateRoot, ids that still
// point at each other, and behaviour on the hydrated page.
import { describeDom, withSite } from "./harness.mjs"

const diff = (a, b) => {
  const lines = []
  for (let index = 0; index < Math.max(a.length, b.length); index++)
    if (a[index] !== b[index]) lines.push(`\n    server: ${a[index]}\n    client: ${b[index]}`)
  return lines.join("")
}

await withSite("hydration", async ({ check, open }) => {
  // The server's HTML as a browser parses it, with no script run.
  const served = await open("/p/basic?render=ssr", { javaScript: false })
  const serverDom = await describeDom(served.page)
  check("server sends the parts", serverDom.length === 20, `${serverDom.length} elements`)
  check(
    "server HTML shows state before hydration",
    serverDom.some((line) => line.includes('id="cmute"') && line.includes('aria-pressed="true"')) &&
      serverDom.filter((line) => line.includes("data-filled")).length === 4 &&
      serverDom.some((line) => line.includes('role="tabpanel"') && line.includes("Panel B"))
  )

  // Hydration, held until the elements are marked.
  const { page, problems } = await open("/p/basic?render=ssr&hold")
  await page.evaluate(() => {
    window.before = [...document.querySelectorAll("[data-root] *")]
  })
  const beforeDom = await describeDom(page)
  check("held page still shows the server's HTML", diff(serverDom, beforeDom) === "", diff(serverDom, beforeDom))
  await page.evaluate(() => window.modes.start())
  await page.waitForSelector("html[data-mounted]")
  await page.waitForTimeout(300)
  const kept = await page.evaluate(() => {
    const after = [...document.querySelectorAll("[data-root] *")]
    return {
      same: after.length === window.before.length && after.every((el, index) => el === window.before[index]),
      connected: window.before.every((el) => el.isConnected),
      count: after.length,
    }
  })
  check("hydration keeps every server element", kept.same && kept.connected, JSON.stringify(kept))
  check("hydration reports no recoverable error", (await page.evaluate(() => window.modes.recoverable)).length === 0, (await page.evaluate(() => window.modes.recoverable)).join("; "))
  check("hydration logs no warning or error", problems.length === 0, problems.join(" || "))

  // The client's own render of the same page, with the same prefix.
  const client = await open("/p/basic?render=client")
  await client.page.waitForTimeout(300)
  const clientDom = await describeDom(client.page)
  const hydratedDom = await describeDom(page)
  const withoutIds = (lines) => lines.map((line) => line.replace(/:o0[\w-]*:/g, ":id:"))
  check(
    "hydrated DOM equals the client's own render, ids aside",
    diff(withoutIds(hydratedDom), withoutIds(clientDom)) === "",
    diff(withoutIds(hydratedDom), withoutIds(clientDom))
  )
  // What core writes once elements bind, which no server can know: a tab
  // learns its panel is in the page, a panel with nothing to focus becomes a
  // tab stop, and a tab that turned out not to be a <button> drops `type`.
  const bound = (line) =>
    line
      .replace(/ aria-controls="[^"]*"/, "")
      .replace(/^(div .*role="tabpanel".*) tabindex="0"/, "$1")
      .replace(/^(a .*) type="button"/, "$1")
  const changed = diff(serverDom.map(bound), hydratedDom.map(bound))
  check("hydration changes only what core writes once elements bind", changed === "", changed)

  // Ids: what the server made is what hydration uses, and references resolve.
  const ids = await page.evaluate(() => {
    const references = ["aria-controls", "aria-labelledby", "aria-describedby"]
    const dangling = []
    for (const el of document.querySelectorAll("[data-root] *"))
      for (const name of references)
        for (const id of (el.getAttribute(name) ?? "").split(" ").filter(Boolean))
          if (!document.getElementById(id) && !el.hasAttribute("data-ids")) dangling.push(`${name}=${id}`)
    const all = [...document.querySelectorAll("[id]")].map((el) => el.id)
    return {
      dangling,
      duplicates: all.filter((id, index) => all.indexOf(id) !== index),
      derived: [...document.querySelectorAll("[data-ids]")].map((el) => el.getAttribute("data-ids")),
    }
  })
  check("no reference points at a missing id", ids.dangling.length === 0, ids.dangling.join(", "))
  check("no id is used twice", ids.duplicates.length === 0, ids.duplicates.join(", "))
  const derived = ids.derived.flatMap((pair) => pair.split(" "))
  check(
    "a slot's two ids derive from one useId and differ per part",
    derived.length === 4 && new Set(derived).size === 4 && derived.every((id) => /-(labelId|hintId)$/.test(id)),
    ids.derived.join(" | ")
  )
  const serverDerived = serverDom.filter((line) => line.includes("data-ids")).map((line) => /data-ids="([^"]*)"/.exec(line)?.[1])
  check("derived ids match the server's", serverDerived.join("|") === ids.derived.join("|"), `${serverDerived.join("|")} vs ${ids.derived.join("|")}`)

  // Behaviour attached to the server's elements.
  const attr = (selector, name) => page.locator(selector).getAttribute(name)
  await page.click("#mute")
  check("uncontrolled part toggles after hydration", (await attr("#mute", "aria-pressed")) === "true")
  await page.click("#cmute")
  check("controlled part reaches the app after hydration", (await attr("#cmute", "aria-pressed")) === "false" && (await page.textContent("#cmute")) === "Mute")
  await page.locator("#stars [role=radio]").nth(3).focus()
  await page.keyboard.press("ArrowRight")
  check("roving focus works after hydration", (await page.textContent("#stars-value")) === "5")
  await page.locator("#tabs [role=tab]").nth(0).click()
  const panel = await page.locator("#tabs [role=tabpanel]").evaluateAll((els) => els.filter((el) => !el.hidden).map((el) => el.textContent).join("|"))
  check("tabs select after hydration", panel === "Panel A", panel)
  const controls = await page.locator("#tabs [role=tab]").nth(0).getAttribute("aria-controls")
  check("a tab controls its panel after hydration", !!controls && (await page.locator(`[id="${controls}"]`).textContent()) === "Panel A", String(controls))
  check("hydrated page logs nothing while used", problems.length === 0, problems.join(" || "))
  const live = await page.evaluate(() => window.modes.agent.snapshot().filter((c) => !c.offPage).length)
  check("each root's instance is kept once", live === 6, `${live} components on the page`)

  // Parts inside a boundary the server streams late. With `early` the client
  // script may run before the late content arrives, when the bundle is fast.
  // Held, the first page hydrates the whole stream's elements as the server
  // sent them.
  const streamedParts = "#late-tabs, #late-tabs [role=tablist], #late-tabs [role=tab], #around, #waited"
  for (const query of ["render=stream&delay=30&hold", "render=stream&delay=700&early"]) {
    const streamed = await open(`/p/streamed?${query}`, { wait: query.includes("hold") ? "load" : "commit" })
    const capture = () =>
      streamed.page.evaluate((selector) => {
        window.before = [...document.querySelectorAll(selector)]
        return [...document.querySelectorAll("#late-tabs [role=tab]")].map((el) => el.id)
      }, streamedParts)
    let tabsBefore = query.includes("hold") ? await capture() : []
    if (query.includes("hold")) await streamed.page.evaluate(() => window.modes.start())
    await streamed.page.waitForSelector("html[data-mounted]")
    const pending = await streamed.page.locator("#late-fallback").count()
    await streamed.page.waitForSelector("#late-tabs")
    await streamed.page.waitForFunction(() => window.modes.probeLog.bound === 3)
    if (!query.includes("hold")) tabsBefore = await capture()
    await streamed.page.locator("#late-tabs [role=tab]").nth(0).click()
    await streamed.page.click("#around")
    await streamed.page.click("#early")
    const after = await streamed.page.evaluate(() => ({
      same: window.before.length === 6 && window.before.every((el) => el.isConnected),
      ids: [...document.querySelectorAll("#late-tabs [role=tab]")].map((el) => el.id),
      selected: [...document.querySelectorAll("#late-tabs [role=tab]")].map((el) => el.getAttribute("aria-selected")).join(","),
      controls: document.querySelector("#late-tabs [role=tab]")?.getAttribute("aria-controls"),
      panel: document.querySelector("#late-tabs [role=tabpanel]")?.id,
      around: document.querySelector("#around")?.getAttribute("aria-pressed"),
      early: document.querySelector("#early")?.getAttribute("aria-pressed"),
      recoverable: window.modes.recoverable,
      log: window.modes.probeLog,
    }))
    const label = `streamed (${pending ? "hydrated while the boundary was pending" : "hydrated after the stream ended"})`
    check(`${label}: server elements are kept and ids hold`, after.same && after.ids.join() === tabsBefore.join() && after.ids.every((id) => id.includes(":o0")), JSON.stringify(after.ids))
    check(`${label}: parts inside and outside the boundary work`, after.selected === "true,false" && after.controls === after.panel && after.around === "true" && after.early === "false", JSON.stringify(after))
    check(`${label}: no instance made twice, no error`, after.log.made === 3 && after.log.bound === 3 && after.recoverable.length === 0 && streamed.problems.length === 0, JSON.stringify(after.log) + streamed.problems.join(" || "))
  }

  // A hidden <Activity> has no server HTML: hydration builds it hidden.
  const activity = await open("/p/activity?render=ssr")
  await activity.page.waitForTimeout(200)
  await activity.page.click("#toggle-late")
  await activity.page.click("#late")
  check(
    "a part hidden by Activity on the server appears and works once shown",
    (await activity.page.getAttribute("#late", "aria-pressed")) === "false" &&
      (await activity.page.evaluate(() => window.modes.recoverable.length)) === 0 &&
      activity.problems.length === 0,
    activity.problems.join(" || ")
  )
})
