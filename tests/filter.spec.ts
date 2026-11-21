// A slot's `input` handler, which the two adapters attach under different
// prop names, and `direct` attributes, which core keeps current itself.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

/** The items a person can see, in order. */
const shown = (page: Page, root: string) =>
  page.locator(`${root} li:not([hidden])`).allTextContents().then((texts) => texts.join(","))

test.beforeEach(async ({ both }) => {
  await both.open("filter")
})

test("typing reaches the app's handler and the part's", async ({ both }) => {
  await both.step("type", async (page) => {
    await page.getByLabel("Filter", { exact: true }).pressSequentially("lu")
    await expect.poll(() => shown(page, "#plain")).toBe("Plum")
    expect(await page.evaluate(() => window.calls)).toEqual([
      ["the app heard", "l"],
      ["the app heard", "lu"],
    ])
  })
  await both.step("clear", async (page) => {
    await page.getByLabel("Filter", { exact: true }).fill("")
    await expect.poll(() => shown(page, "#plain")).toBe("Apple,Pear,Plum")
  })
})

test("a direct attribute changes on the element without the part rendering again", async ({ both }) => {
  await both.step("type", async (page) => {
    const before = await page.evaluate(() => ({ ...window.renders }))
    await page.getByLabel("Filter", { exact: true }).pressSequentially("ea")
    await expect.poll(() => shown(page, "#plain")).toBe("Pear")
    await expect(page.locator("#plain li").nth(0)).toHaveAttribute("hidden", "")
    expect(await page.evaluate(() => ({ ...window.renders }))).toEqual(before)
  })
})

test("preventDefault() in the app's input handler skips the part's", async ({ both }) => {
  await both.step("type", async (page) => {
    await page.getByLabel("Filter that the app stops").pressSequentially("pl")
    expect(await page.evaluate(() => window.calls)).toEqual([["the app prevented"], ["the app prevented"]])
    await expect.poll(() => shown(page, "#prevented")).toBe("Apple,Pear,Plum")
  })
})
