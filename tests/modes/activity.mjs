// <Activity>: parts hidden and shown keep their state, let go of what they
// hold while hidden and work again when shown; hidden from the first render
// they start when shown; removed while hidden, or with their element out of
// the page while hidden, they are destroyed.
import { withSite } from "./harness.mjs"

await withSite("Activity", async ({ check, open }) => {
  const { page, problems } = await open("/p/activity?render=client")
  const read = () =>
    page.evaluate(() => ({
      log: { ...window.modes.probeLog },
      live: window.modes.agent.snapshot().filter((c) => !c.offPage).length,
      free: document.querySelector("#free")?.getAttribute("aria-pressed"),
      held: document.querySelector("#held")?.getAttribute("aria-pressed"),
      late: document.querySelector("#late")?.getAttribute("aria-pressed"),
      shown: !!document.querySelector("#inside") && getComputedStyle(document.querySelector("#inside")).display !== "none",
      tabs: [...document.querySelectorAll("#tabs [role=tab]")].map((el) => el.getAttribute("aria-selected")).join(","),
      panel: document.querySelector("#tabs [role=tabpanel]")?.textContent,
    }))
  const settle = () => page.waitForTimeout(150)
  await settle()

  let now = await read()
  check("a part hidden from its first render is made but neither bound nor kept", now.log.made === 3 && now.log.bound === 2 && now.live === 3, JSON.stringify(now))

  // State to keep: the free probe on, the second tab selected.
  await page.click("#free")
  await page.locator("#tabs [role=tab]").nth(1).click()
  await page.click("#toggle")
  await settle()
  now = await read()
  check("hidden: the subtree is hidden, not removed", !now.shown && now.free === "true")
  check("hidden: parts let go of their elements", now.log.unbound === 2 && now.log.destroyed === 0, JSON.stringify(now.log))
  check("hidden: instances are released, none destroyed", now.live === 0 && now.log.destroyed === 0, `${now.live} kept`)

  // A controlled option changed while hidden shows when the part is shown.
  await page.click("#outside")
  await page.click("#toggle")
  await settle()
  now = await read()
  check("shown: state is kept", now.shown && now.free === "true" && now.tabs === "false,true" && now.panel === "Panel B", JSON.stringify(now))
  check("shown: a controlled option changed while hidden shows", now.held === "true")
  check("shown: the same instances are bound and kept again", now.log.made === 3 && now.log.bound === 4 && now.log.unbound === 2 && now.live === 3, JSON.stringify(now))
  const presses = now.log.presses
  await page.click("#free")
  await page.click("#held")
  await page.locator("#tabs [role=tab]").nth(0).click()
  now = await read()
  check("shown: parts work, one listener each", now.free === "false" && now.held === "false" && now.panel === "Panel A" && now.log.presses === presses + 2, JSON.stringify(now))

  const live = now.live
  await page.click("#blink")
  await settle()
  now = await read()
  check("hidden and shown in one task: the instances are kept", now.shown && now.live === live && now.log.destroyed === 0, JSON.stringify(now))
  await page.click("#free")
  now = await read()
  check("hidden and shown in one task: parts work", now.free === "true", JSON.stringify(now))
  await page.click("#free")

  await page.click("#toggle-late")
  await settle()
  await page.click("#late")
  now = await read()
  check("a part hidden from its first render works once shown", now.late === "false" && now.log.bound === 5 && now.live === 4, JSON.stringify(now))

  // Hidden, then its element leaves the page: the sweep destroys it. Put back
  // and shown, the component makes a new instance that starts where it was.
  await page.click("#free")
  await page.locator("#tabs [role=tab]").nth(1).click()
  await page.click("#toggle")
  await settle()
  await page.evaluate(() => {
    const shell = document.querySelector("#shell")
    window.shell = { el: shell, parent: shell.parentNode, next: shell.nextSibling }
    shell.remove()
  })
  await page.waitForTimeout(1300)
  now = await read()
  check("hidden with its element out of the page: destroyed within the sweep", now.log.destroyed === 2, JSON.stringify(now.log))
  await page.evaluate(() => window.shell.parent.insertBefore(window.shell.el, window.shell.next))
  await page.click("#toggle")
  await settle()
  now = await read()
  check("shown again: new instances start from the old state", now.log.made === 5 && now.free === "true" && now.tabs === "false,true" && now.panel === "Panel B", JSON.stringify(now))
  check("shown again: every element is bound once", now.log.bound - now.log.unbound === 3 && now.live === 4, JSON.stringify(now))
  const before = now.log.presses
  await page.click("#free")
  await page.click("#held")
  now = await read()
  check("shown again: parts work, one listener each", now.free === "false" && now.held === "true" && now.log.presses === before + 2, JSON.stringify(now))

  // Removed while hidden.
  await page.click("#toggle")
  await settle()
  await page.click("#unmount")
  await page.waitForTimeout(1300)
  now = await read()
  check("removed while hidden: destroyed, nothing left bound", now.log.destroyed === 4 && now.log.bound - now.log.unbound === 1 && now.live === 1, JSON.stringify(now))
  check("nothing logged", problems.length === 0, problems.join(" || "))
})
