// StrictMode: whether Octane's replays renders or effects, and parts under it.
// Octane's StrictMode returns its children (octane/dist/compatibility.js), so
// one render, one initializer and one run of each effect is the expected count.
import { withSite } from "./harness.mjs"

await withSite("StrictMode", async ({ check, open }) => {
  for (const render of ["client", "ssr"]) {
    const { page, problems } = await open(`/p/strict?render=${render}`)
    await page.waitForTimeout(200)
    await page.click("#read")
    const counts = JSON.parse(await page.getAttribute("#counts", "data-counts"))
    check(
      `${render}: StrictMode runs each initializer and effect once`,
      counts.initializers === 1 && counts.layouts === 1 && counts.effects === 1 && counts.cleanups === 0,
      JSON.stringify(counts)
    )
    const log = await page.evaluate(() => window.modes.probeLog)
    check(`${render}: each part's instance is made and bound once`, log.made === 2 && log.bound === 2 && log.unbound === 0 && log.destroyed === 0, JSON.stringify(log))
    const live = await page.evaluate(() => window.modes.agent.snapshot().filter((c) => !c.offPage).length)
    check(`${render}: three instances are kept`, live === 3, String(live))
    await page.click("#free")
    await page.click("#held")
    await page.locator("#tabs [role=tab]").nth(1).click()
    const used = await page.evaluate(() => ({
      free: document.querySelector("#free").getAttribute("aria-pressed"),
      held: document.querySelector("#held").getAttribute("aria-pressed") + document.querySelector("#held").textContent,
      panel: document.querySelector("#tabs [role=tabpanel]").textContent,
      presses: window.modes.probeLog.presses,
    }))
    check(`${render}: parts work under StrictMode, one listener each`, used.free === "true" && used.held === "trueOn" && used.panel === "Panel B" && used.presses === 2, JSON.stringify(used))
    check(`${render}: nothing logged`, problems.length === 0, problems.join(" || "))
  }
})
