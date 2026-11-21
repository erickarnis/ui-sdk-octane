// Transitions and Suspense. First Octane alone: what a transition that
// suspends does to the effects and refs of content already on screen, which
// is what decides how a part may hold its element. Then parts: a controlled
// value changed in a transition, a transition that suspends and is finished
// or superseded, content that suspends again after it showed, and a part
// suspended from its first render.
import { withSite } from "./harness.mjs"

await withSite("transitions and Suspense", async ({ check, note, open }) => {
  // Octane's own behaviour, with no part on the page.
  const octane = await open("/p/octane-held?render=client")
  await octane.page.waitForTimeout(200)
  await octane.page.evaluate(() => window.heldLog.splice(0))
  await octane.page.click("#go")
  await octane.page.waitForTimeout(300)
  const heldLog = await octane.page.evaluate(() => window.heldLog.splice(0))
  const cycled = heldLog.filter((line) => line.endsWith("cleanup")).length
  const refs = heldLog.filter((line) => line.includes(" ref ")).length
  note(`Octane, transition held: ${heldLog.join(", ") || "nothing ran"}`)
  check(
    "Octane keeps what is on screen through a transition that suspends",
    (await octane.page.textContent("main")).includes("ready") && !(await octane.page.textContent("main")).includes("Loading")
  )
  note(
    cycled
      ? `Octane ran ${cycled} effect cleanups of content that stayed on screen and called ${refs} refs: effects run again, refs that keep their identity do not`
      : "Octane ran no effect cleanup for a held transition: the adapter no longer depends on this"
  )

  const { page, problems } = await open("/p/transition?render=client")
  await page.waitForTimeout(200)
  const read = () =>
    page.evaluate(() => {
      const probe = (id) => {
        const el = document.querySelector(id)
        return el ? `${el.getAttribute("aria-pressed")}/${el.textContent}` : "none"
      }
      return {
        log: { ...window.modes.probeLog },
        live: window.modes.agent.snapshot().filter((c) => !c.offPage).length,
        plain: probe("#plain-probe"),
        stars: `${document.querySelector("#plain-value").textContent} ${[...document.querySelectorAll("#plain-stars [role=radio]")].map((el) => el.getAttribute("aria-checked")[0]).join("")}`,
        pending: document.querySelector("#plain-value").dataset.pending,
        held: probe("#held-probe"),
        fallback: !!document.querySelector("#held-fallback"),
        heldLog: document.querySelector("#held-log").textContent,
        first: probe("#first-probe"),
      }
    })
  const settle = () => page.waitForTimeout(250)
  const bound = (state) => state.log.bound - state.log.unbound

  let now = await read()
  check("start: two probes bound, three instances kept", bound(now) === 2 && now.live === 3, JSON.stringify(now))

  // A controlled value set inside a transition.
  await page.click("#plain-flip")
  await settle()
  now = await read()
  check("startTransition: a controlled value shows once it commits", now.plain === "true/On")
  await page.click("#plain-probe")
  await settle()
  now = await read()
  check("startTransition: the part's own change still reaches the app", now.plain === "false/Off")
  await page.locator("#plain-stars [role=radio]").nth(2).click()
  await settle()
  now = await read()
  check("useTransition: a value changed from a part's callback commits", now.stars === "3 fft" && now.pending === "false", JSON.stringify(now.stars))

  // A transition that suspends: the screen and the instance keep the old
  // value, and the part keeps its element.
  await page.click("#held-go")
  await settle()
  now = await read()
  check("held transition: the screen keeps the committed value", now.held === "false/ready" && !now.fallback, now.held)
  check("held transition: the part keeps its element", bound(now) === 2, JSON.stringify(now.log))
  check("held transition: the instance stays kept", now.live === 3, `${now.live} kept`)
  await page.evaluate(() => window.openGate())
  await settle()
  now = await read()
  check("held transition: finished, the new value and content show", now.held === "true/loaded 1", now.held)
  check("held transition: finished, the part still has its element", bound(now) === 2 && now.live === 3, JSON.stringify(now.log))
  await page.click("#held-probe")
  await settle()
  now = await read()
  check("held transition: the part's callback is the committed render's", now.held === "false/loaded 1" && now.heldLog === "true>false", `${now.held} ${now.heldLog}`)

  // The render with the new value is thrown away.
  await page.click("#held-go")
  await settle()
  await page.click("#held-supersede")
  await settle()
  now = await read()
  check("superseded transition: the discarded value never shows", now.held === "false/ready" && bound(now) === 2 && now.live === 3, JSON.stringify(now))
  await page.click("#held-probe")
  await settle()
  now = await read()
  check("superseded transition: the instance has the committed options", now.held === "true/ready" && now.heldLog === "true>false,false>true", `${now.held} ${now.heldLog}`)

  // Content that suspends again outside a transition: the fallback shows,
  // the part lets go, and comes back with what changed meanwhile.
  await page.click("#held-urgent")
  await settle()
  now = await read()
  check("suspended again: the fallback shows and the part lets go", now.fallback && bound(now) === 1, JSON.stringify(now.log))
  await page.click("#held-outside")
  await settle()
  await page.evaluate(() => window.openGate())
  await settle()
  now = await read()
  check("suspended again: shown again with the value set meanwhile", !now.fallback && now.held.startsWith("false/loaded") && bound(now) === 2 && now.live === 3, JSON.stringify(now))
  const presses = now.log.presses
  await page.click("#held-probe")
  await settle()
  now = await read()
  check("suspended again: the part works, one listener", now.held.startsWith("true/") && now.log.presses === presses + 1, now.held)

  // Suspended from its first render.
  const made = now.log.made
  await page.click("#show-first")
  await settle()
  now = await read()
  check("first render suspended: one instance made, not bound, not kept", now.log.made === made + 1 && bound(now) === 2 && now.live === 3, JSON.stringify(now))
  await page.evaluate(() => window.openGate())
  await settle()
  now = await read()
  check("first render suspended: shown, the same instance is bound and kept", now.first === "true/first content" && now.log.made === made + 1 && bound(now) === 3 && now.live === 4, JSON.stringify(now))
  await page.click("#first-probe")
  await page.click("#hide-first")
  await page.waitForTimeout(1300)
  now = await read()
  check("first render suspended: removed, it is destroyed", now.log.destroyed === 1 && bound(now) === 2 && now.live === 3, JSON.stringify(now))
  check("nothing logged", problems.length === 0, problems.join(" || "))
})
