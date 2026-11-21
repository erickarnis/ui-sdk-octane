// Roving focus: one tab stop among a list of parts, arrow keys between them,
// and a list the app grows, shrinks and reorders under it.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const stars = (page: Page) => page.locator("#stars [role=radio]")
const star = (page: Page, value: number) => page.getByLabel(`${value} stars`, { exact: true })
/** Each star's tabindex, in the order the page shows them: "-1,0,-1,-1,-1". */
const tabStops = (page: Page) =>
  stars(page).evaluateAll((els) => els.map((el) => el.getAttribute("tabindex")).join(","))
/** The values of the stars, in the order the page shows them: "1,2,3,4,5". */
const order = (page: Page) =>
  stars(page).evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")?.replace(" stars", "")).join(","))
const focused = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("aria-label"))

test.beforeEach(async ({ both }) => {
  await both.open("rating")
})

test("the chosen star is the group's one tab stop", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect(page.locator("#stars")).toHaveAttribute("role", "radiogroup")
    await expect.poll(() => tabStops(page)).toBe("-1,0,-1,-1,-1")
    await expect(star(page, 2)).toHaveAttribute("aria-checked", "true")
  })
  await both.step("Tab into the group and out again", async (page) => {
    await page.locator("#before").focus()
    await page.keyboard.press("Tab")
    await expect(star(page, 2)).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(page.locator("#after")).toBeFocused()
  })
})

test("ArrowRight moves focus, rates, and the tab stop follows", async ({ both }) => {
  await both.step("ArrowRight from the second star", async (page) => {
    await star(page, 2).focus()
    await page.keyboard.press("ArrowRight")
    await expect(page.locator("#stars-value")).toHaveText("3")
    await expect(star(page, 3)).toBeFocused()
    await expect.poll(() => tabStops(page)).toBe("-1,-1,0,-1,-1")
    expect(await page.evaluate(() => window.calls)).toEqual([["onValueChange", 3, "list-navigation"]])
  })
})

test("arrow keys loop past the first star", async ({ both }) => {
  await both.step("ArrowLeft twice from the second star", async (page) => {
    await star(page, 2).focus()
    await page.keyboard.press("ArrowLeft")
    await expect(page.locator("#stars-value")).toHaveText("1")
    await page.keyboard.press("ArrowLeft")
    await expect(page.locator("#stars-value")).toHaveText("5")
    await expect(star(page, 5)).toBeFocused()
  })
})

test("a click rates, and each star's attributes follow the value", async ({ both }) => {
  await both.step("click the fourth star", async (page) => {
    await star(page, 4).click()
    await expect(page.locator("#stars-value")).toHaveText("4")
    await expect(page.locator("#stars [data-filled]")).toHaveCount(4)
    await expect(star(page, 4)).toHaveAttribute("aria-checked", "true")
    await expect(star(page, 2)).toHaveAttribute("aria-checked", "false")
  })
  await both.step("click the first star", async (page) => {
    await star(page, 1).click()
    await expect(page.locator("#stars-value")).toHaveText("1")
    await expect(page.locator("#stars [data-filled]")).toHaveCount(1)
    expect(await page.evaluate(() => window.calls)).toEqual([
      ["onValueChange", 4, "item-press"],
      ["onValueChange", 1, "item-press"],
    ])
  })
})

test("uncontrolled: the first star holds the tab stop until one is chosen", async ({ both }) => {
  await both.step("press the third", async (page) => {
    const free = page.locator("#free [role=radio]")
    await expect(free.nth(0)).toHaveAttribute("tabindex", "0")
    await free.nth(2).click()
    await expect(free.nth(2)).toHaveAttribute("aria-checked", "true")
    await expect(free.nth(2)).toHaveAttribute("tabindex", "0")
    await expect(free.nth(0)).toHaveAttribute("tabindex", "-1")
    await expect(page.locator("#free [data-filled]")).toHaveCount(3)
  })
})

test("a list that grows: the new parts join the roving group", async ({ both }) => {
  await both.step("add two stars", async (page) => {
    await page.locator("#grow").click()
    await page.locator("#grow").click()
    await expect.poll(() => order(page)).toBe("1,2,3,4,5,6,7")
    await expect.poll(() => tabStops(page)).toBe("-1,0,-1,-1,-1,-1,-1")
  })
  await both.step("End reaches the last one", async (page) => {
    await star(page, 2).focus()
    await page.keyboard.press("End")
    await expect(star(page, 7)).toBeFocused()
    await expect(page.locator("#stars-value")).toHaveText("7")
    await expect(page.locator("#stars [data-filled]")).toHaveCount(7)
  })
})

test("a list that shrinks: the parts that left are out of the roving group", async ({ both }) => {
  await both.step("remove two stars", async (page) => {
    await page.locator("#shrink").click()
    await page.locator("#shrink").click()
    await expect.poll(() => order(page)).toBe("1,2,3")
  })
  await both.step("ArrowRight loops after the third", async (page) => {
    await star(page, 3).click()
    await page.keyboard.press("ArrowRight")
    await expect(star(page, 1)).toBeFocused()
    await expect(page.locator("#stars-value")).toHaveText("1")
  })
})

test("a list that shrinks past the chosen part leaves one tab stop", async ({ both }) => {
  await both.step("choose the last star, then remove it", async (page) => {
    await star(page, 5).click()
    await page.locator("#shrink").click()
    await expect.poll(() => order(page)).toBe("1,2,3,4")
    await expect.poll(async () => (await tabStops(page)).split(",").filter((stop) => stop === "0").length).toBe(1)
  })
})

test("a list that reorders: parts keep their state and arrows follow the new order", async ({ both }) => {
  await both.step("reverse", async (page) => {
    await page.locator("#reverse").click()
    await expect.poll(() => order(page)).toBe("5,4,3,2,1")
    await expect.poll(() => tabStops(page)).toBe("-1,-1,-1,0,-1")
    await expect(star(page, 2)).toHaveAttribute("aria-checked", "true")
  })
  await both.step("ArrowRight goes to the star now after it", async (page) => {
    await star(page, 2).focus()
    await page.keyboard.press("ArrowRight")
    expect(await focused(page)).toBe("1 stars")
    await expect(page.locator("#stars-value")).toHaveText("1")
  })
})

test("a list that reorders keeps focus on the part that had it", async ({ both }) => {
  await both.step("focus the second star, reverse with the keyboard elsewhere", async (page) => {
    await star(page, 2).focus()
    await page.evaluate(() => document.getElementById("reverse")?.click())
    await expect.poll(() => order(page)).toBe("5,4,3,2,1")
    await expect(star(page, 2)).toBeFocused()
  })
})
