// Core's accordion: parts nested in an item take the item's `value`, and each
// item's panel comes and goes with the root's value.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const triggers = (page: Page, root: string) => page.locator(`${root} [data-slot=accordion-trigger]`)
const panels = (page: Page, root: string) => page.locator(`${root} [data-slot=accordion-panel]`)
/** Each trigger's aria-expanded, in order: "true,false,false". */
const expanded = (page: Page, root: string) =>
  triggers(page, root).evaluateAll((els) => els.map((el) => el.getAttribute("aria-expanded")).join(","))

test.beforeEach(async ({ both }) => {
  await both.open("accordion")
})

test("a header, trigger and panel take their item's value from the part around them", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect.poll(() => expanded(page, "#single")).toBe("true,false,false")
    const trigger = triggers(page, "#single").nth(0)
    const panel = panels(page, "#single")
    await expect(panel).toHaveCount(1)
    await expect(panel).toHaveText("All about shipping.")
    expect(await trigger.getAttribute("id")).toMatch(/-trigger-shipping$/)
    expect(await panel.getAttribute("id")).toMatch(/-panel-shipping$/)
    expect(await trigger.getAttribute("aria-controls")).toBe(await panel.getAttribute("id"))
    expect(await panel.getAttribute("aria-labelledby")).toBe(await trigger.getAttribute("id"))
    await expect(page.locator("#single [data-slot=accordion-header]").nth(0)).toHaveAttribute("data-open", "")
    await expect(page.locator("#single [data-slot=accordion-item]").nth(1)).toHaveAttribute("data-closed", "")
  })
})

test("opening one item closes the other, and both items and the root hear it", async ({ both }) => {
  await both.step("press the second trigger", async (page) => {
    await triggers(page, "#single").nth(1).click()
    await expect.poll(() => expanded(page, "#single")).toBe("false,true,false")
    await expect(panels(page, "#single")).toHaveText("All about returns.")
    await expect(panels(page, "#single")).toHaveCount(1)
  })
  await both.step("the callbacks", async (page) => {
    const calls = await page.evaluate(() => window.calls)
    expect(calls).toContainEqual(["single onValueChange", ["returns"], "trigger-press"])
    expect(calls).toContainEqual(["returns onOpenChange", true])
    expect(calls).toContainEqual(["shipping onOpenChange", false])
  })
})

test("a slot prop on the item reaches the parts inside it: disabled", async ({ both }) => {
  await both.step("press the disabled item's trigger", async (page) => {
    const trigger = triggers(page, "#single").nth(2)
    await expect(trigger).toHaveAttribute("aria-disabled", "true")
    await expect(page.locator("#single [data-slot=accordion-header]").nth(2)).toHaveAttribute("data-disabled", "")
    await trigger.click({ force: true })
    await expect.poll(() => expanded(page, "#single")).toBe("true,false,false")
  })
})

test("multiple and controlled: each press asks the app, and panels follow its value", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect.poll(() => expanded(page, "#multiple")).toBe("false,true,false")
    await expect(panels(page, "#multiple")).toHaveCount(3)
    await expect(panels(page, "#multiple").nth(0)).toHaveAttribute("hidden", "")
    await expect(panels(page, "#multiple").nth(0)).toHaveText("shipping is closed")
    await expect(panels(page, "#multiple").nth(1)).toHaveText("returns is open")
  })
  await both.step("open a second item", async (page) => {
    await triggers(page, "#multiple").nth(0).click()
    await expect.poll(() => expanded(page, "#multiple")).toBe("true,true,false")
    await expect(page.locator("#value")).toHaveText("returns,shipping")
    await expect(panels(page, "#multiple").nth(0)).toHaveText("shipping is open")
    await expect(panels(page, "#multiple").nth(0)).not.toHaveAttribute("hidden")
  })
  await both.step("close the first one opened", async (page) => {
    await triggers(page, "#multiple").nth(1).click()
    await expect.poll(() => expanded(page, "#multiple")).toBe("true,false,false")
    await expect(panels(page, "#multiple").nth(1)).toHaveText("returns is closed")
  })
})

test("a value set from outside opens every item it names", async ({ both }) => {
  await both.step("open all", async (page) => {
    await page.locator("#open-all").click()
    await expect.poll(() => expanded(page, "#multiple")).toBe("true,true,true")
    await expect(panels(page, "#multiple").nth(2)).toHaveText("warranty is open")
  })
})
