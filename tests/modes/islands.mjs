// Several roots on one page, as Astro islands are: the same page mounted in
// two roots, each with its own identifier prefix. One root's parts must not
// change the other's, their ids must differ, and one unmounting must leave
// the other working. The adapter's module-level state is shared by both.
import { withSite } from "./harness.mjs"

await withSite("islands", async ({ check, open }) => {
  for (const render of ["client", "ssr"]) {
    const { page, problems } = await open(`/p/basic?roots=2&render=${render}`)
    await page.waitForTimeout(200)
    const read = () =>
      page.evaluate(() => {
        const made = [...document.querySelectorAll("[id*=':']")].map((el) => el.id)
        return {
          made: made.length,
          repeated: made.filter((id, index) => made.indexOf(id) !== index),
          live: window.modes.agent.snapshot().filter((c) => !c.offPage).length,
          recoverable: window.modes.recoverable,
          roots: [...document.querySelectorAll("[data-root]")].map((root) =>
            [
              [...root.querySelectorAll("[data-slot=mute-button]")].map((el) => el.getAttribute("aria-pressed")[0]).join(""),
              root.querySelector("output")?.textContent,
              [...root.querySelectorAll("[role=tab]")].map((el) => el.getAttribute("aria-selected")[0]).join(""),
              root.querySelector("[role=tabpanel]")?.textContent,
              [...root.querySelectorAll("[role=radio]")].map((el) => el.getAttribute("tabindex")).join(""),
            ].join(" ")
          ),
          dangling: [...document.querySelectorAll("[data-root]")].flatMap((root) =>
            [...root.querySelectorAll("[aria-controls], [aria-labelledby]")]
              .filter((el) => !el.hasAttribute("data-ids"))
              .flatMap((el) => [el.getAttribute("aria-controls"), el.getAttribute("aria-labelledby")])
              .filter((id) => id && !root.querySelector(`[id="${id}"]`))
          ),
        }
      })
    const start = await read()
    check(`${render}: both roots render the same state`, start.roots[0] === start.roots[1] && start.roots[0] === "ftf 4 ftf Panel B -1-1-10-1", start.roots.join(" | "))
    check(`${render}: made ids differ between roots`, start.made >= 8 && start.repeated.length === 0, start.repeated.join(", "))
    check(`${render}: every reference resolves inside its own root`, start.dangling.length === 0, start.dangling.join(", "))
    check(`${render}: each root keeps its own instances`, start.live === 12 && start.recoverable.length === 0, `${start.live} kept`)

    // Use the second root only.
    const second = page.locator("[data-root]").nth(1)
    await second.locator("[data-slot=mute-button]").nth(0).click()
    await second.locator("[data-slot=mute-button]").nth(1).click()
    await second.locator("[role=tab]").nth(0).click()
    await second.locator("[role=radio]").nth(3).focus()
    await page.keyboard.press("ArrowRight")
    const used = await read()
    check(`${render}: the second root changes`, used.roots[1] === "tff 5 tff Panel A -1-1-1-10", used.roots[1])
    check(`${render}: the first root does not`, used.roots[0] === start.roots[0], used.roots[0])

    // Unmount the first root: its instances go, the second keeps working.
    await page.evaluate(() => window.modes.roots[0].unmount())
    await page.waitForTimeout(1300)
    const left = await read()
    check(`${render}: an unmounted root's instances are released`, left.live === 6, `${left.live} kept`)
    await second.locator("[role=tab]").nth(2).click()
    await page.keyboard.press("ArrowLeft")
    await second.locator("[data-slot=mute-button]").nth(0).click()
    const after = await read()
    check(`${render}: the other root still works`, after.roots[1] === "fff 5 ftf Panel B -1-1-1-10", after.roots[1])
    check(`${render}: nothing logged`, problems.length === 0, problems.join(" || "))
  }
})
