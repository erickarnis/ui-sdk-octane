// Parts nested in another part that take a prop from it, and a roving list
// with typeahead, over items the app adds, sorts and removes.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const item = (page: Page, fruit: string) => page.locator(`#fruits [role=option]:has([data-item=${fruit}])`)
const order = (page: Page) =>
  page.locator("#fruits [data-slot=picker-item-label]").allTextContents().then((texts) => texts.join(","))
const checked = (page: Page) =>
  page.locator("#fruits [role=option]:has([data-slot=picker-item-check]) [data-slot=picker-item-label]").allTextContents()

test.beforeEach(async ({ both }) => {
  await both.open("picker")
})

test("a nested part takes the prop it left out from the part around it", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect(item(page, "apple").locator("[data-slot=picker-item-label]")).toHaveAttribute("data-item", "apple")
    await expect(item(page, "pear").locator("[data-slot=picker-item-label]")).toHaveAttribute("data-chosen", "")
    await expect(item(page, "apple").locator("[data-slot=picker-item-label]")).not.toHaveAttribute("data-chosen")
    expect(await checked(page)).toEqual(["pear"])
  })
})

test("a nested part's presence follows the prop it took: the check moves with the choice", async ({ both }) => {
  await both.step("choose plum", async (page) => {
    await item(page, "plum").click()
    await expect(item(page, "plum")).toHaveAttribute("aria-selected", "true")
    await expect.poll(() => checked(page)).toEqual(["plum"])
    await expect(item(page, "plum").locator("[data-slot=picker-item-label]")).toHaveAttribute("data-chosen", "")
    await expect(item(page, "pear").locator("[data-slot=picker-item-label]")).not.toHaveAttribute("data-chosen")
    expect(await page.evaluate(() => window.calls)).toEqual([["onValueChange", "plum", "item-press"]])
  })
})

test("a prop written on the nested part wins over the one around it", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect(page.locator("#explicit [data-slot=picker-item-label]")).toHaveAttribute("data-item", "plum")
    await expect(page.locator("#explicit [data-slot=picker-item-label]")).toHaveAttribute("data-chosen", "")
    await expect(page.locator("#explicit [data-slot=picker-item-check]")).toHaveText("✓")
    await expect(page.locator("#explicit [role=option]")).toHaveAttribute("aria-selected", "false")
  })
})

test("the chosen item is the tab stop, and arrows move focus without choosing", async ({ both }) => {
  await both.step("ArrowDown, ArrowUp, End, Home", async (page) => {
    await expect(item(page, "pear")).toHaveAttribute("tabindex", "0")
    await item(page, "pear").focus()
    await page.keyboard.press("ArrowDown")
    await expect(item(page, "plum")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await expect(item(page, "plum")).toBeFocused()
    await page.keyboard.press("Home")
    await expect(item(page, "apple")).toBeFocused()
    await expect(item(page, "pear")).toHaveAttribute("aria-selected", "true")
    await expect(item(page, "apple")).toHaveAttribute("tabindex", "0")
  })
})

test("typing a letter moves focus to the next item that starts with it", async ({ both }) => {
  await both.step("p from apple, then p again", async (page) => {
    await item(page, "apple").focus()
    await page.keyboard.press("p")
    await expect(item(page, "pear")).toBeFocused()
    await page.keyboard.press("p")
    await expect(item(page, "plum")).toBeFocused()
  })
})

test("typing two letters quickly finds the item that starts with both", async ({ both }) => {
  await both.step("pl from apple", async (page) => {
    await item(page, "apple").focus()
    await page.keyboard.type("pl")
    await expect(item(page, "plum")).toBeFocused()
  })
})

test("an item added to the list is found by typing and reached by arrows", async ({ both }) => {
  await both.step("add peach", async (page) => {
    await page.locator("#add").click()
    await expect.poll(() => order(page)).toBe("apple,pear,plum,peach")
    await expect(item(page, "peach").locator("[data-slot=picker-item-label]")).toHaveAttribute("data-item", "peach")
  })
  await both.step("End, then choose it with Enter", async (page) => {
    await item(page, "pear").focus()
    await page.keyboard.press("End")
    await expect(item(page, "peach")).toBeFocused()
    await item(page, "peach").click()
    await expect.poll(() => checked(page)).toEqual(["peach"])
  })
})

test("items sorted into a new order keep their state, and arrows follow the new order", async ({ both }) => {
  await both.step("sort backwards", async (page) => {
    await page.locator("#sort").click()
    await expect.poll(() => order(page)).toBe("plum,pear,apple")
    expect(await checked(page)).toEqual(["pear"])
    await expect(item(page, "pear")).toHaveAttribute("tabindex", "0")
  })
  await both.step("ArrowDown from pear", async (page) => {
    await item(page, "pear").focus()
    await page.keyboard.press("ArrowDown")
    await expect(item(page, "apple")).toBeFocused()
  })
})

test("removing the chosen item leaves one tab stop and a list that still chooses", async ({ both }) => {
  await both.step("drop pear", async (page) => {
    await page.locator("#drop").click()
    await expect.poll(() => order(page)).toBe("apple,plum")
    await expect(page.locator("#fruits [role=option][tabindex='0']")).toHaveCount(1)
    expect(await checked(page)).toEqual([])
  })
  await both.step("choose plum", async (page) => {
    await item(page, "plum").click()
    await expect.poll(() => checked(page)).toEqual(["plum"])
  })
})
