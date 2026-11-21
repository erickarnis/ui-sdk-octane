// What makes a part render again: its attributes, its presence, and the
// state its render functions read, and nothing else.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const renders = (page: Page) => page.evaluate(() => ({ ...window.renders }))
/** The names whose render count grew during `action`. */
async function renderedDuring(page: Page, action: () => Promise<void>) {
  const before = await renders(page)
  await action()
  const after = await renders(page)
  return Object.keys(after).filter((name) => after[name] !== before[name]).sort()
}

test.beforeEach(async ({ both }) => {
  await both.open("live")
})

test("a live attribute changes on the element without the part rendering again", async ({ both }) => {
  await both.step("hover a seat", async (page) => {
    const changed = await renderedDuring(page, async () => {
      await page.locator("#seat-A").hover()
      await expect(page.locator("#seat-A")).toHaveAttribute("data-hovered", "")
      await expect(page.locator("#hovering")).toHaveText("Hovering A")
    })
    expect(changed).toEqual(["hovering label"])
  })
  await both.step("hover another", async (page) => {
    const changed = await renderedDuring(page, async () => {
      await page.locator("#seat-C").hover()
      await expect(page.locator("#seat-C")).toHaveAttribute("data-hovered", "")
      await expect(page.locator("#seat-A")).not.toHaveAttribute("data-hovered")
      await expect(page.locator("#hovering")).toHaveText("Hovering C")
    })
    expect(changed).toEqual(["hovering label"])
  })
  await both.step("leave", async (page) => {
    await page.locator("#elsewhere").hover()
    await expect(page.locator("#seat-C")).not.toHaveAttribute("data-hovered")
    await expect(page.locator("#hovering")).toHaveText("Hovering nothing")
  })
})

test("a change of value renders the parts whose attributes it changes and the one that reads it", async ({ both }) => {
  await both.step("choose another seat", async (page) => {
    await expect(page.locator("#seat-B")).toHaveAttribute("aria-pressed", "true")
    await page.locator("#elsewhere").hover()
    const changed = await renderedDuring(page, async () => {
      await page.locator("#seat-C").focus()
      await page.keyboard.press("Enter")
      await expect(page.locator("#seat-C")).toHaveAttribute("aria-pressed", "true")
      await expect(page.locator("#seat-B")).toHaveAttribute("aria-pressed", "false")
      await expect(page.locator("#chosen")).toHaveText("Chosen C")
    })
    expect(changed).toEqual(["chosen label", "seat B", "seat C"])
    expect(await page.evaluate(() => window.calls)).toEqual([["onValueChange", "C", "item-press"]])
  })
})

test("an attribute an app's render keeps current survives a live write", async ({ both }) => {
  await both.step("hover, choose, and hover again", async (page) => {
    await page.locator("#seat-A").hover()
    await page.locator("#seat-A").click()
    await expect(page.locator("#seat-A")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#seat-A")).toHaveAttribute("data-hovered", "")
    await page.locator("#seat-B").hover()
    await expect(page.locator("#seat-A")).not.toHaveAttribute("data-hovered")
    await expect(page.locator("#seat-A")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#seat-B")).toHaveAttribute("data-hovered", "")
  })
})
