// The app's refs on parts, and parts that remount.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const calls = (page: Page) => page.evaluate(() => window.calls)
const star = (page: Page, value: number) => page.getByLabel(`${value} of 3`, { exact: true })

test.beforeEach(async ({ both }) => {
  await both.open("refs")
})

test("an object ref and a stable callback ref hold the part's element", async ({ both }) => {
  await both.step("read", async (page) => {
    await page.locator("#read").click()
    const heard = await calls(page)
    expect(heard).toContainEqual(["stable ref", "<button#stable>"])
    expect(heard.at(-1)).toEqual(["object ref holds", "<button#object>"])
  })
})

test("a stable callback ref is called once, however often the part renders", async ({ both }) => {
  await both.step("press, and render the app again", async (page) => {
    await page.locator("#stable").click()
    await page.locator("#again").click()
    await expect(page.locator("#again")).toHaveText("Render again (1)")
    await expect(page.locator("#stable")).toHaveAttribute("aria-pressed", "true")
    expect((await calls(page)).filter(([name]) => name === "stable ref")).toEqual([["stable ref", "<button#stable>"]])
  })
})

test("a ref written inline is attached after every render, and the part stays bound", async ({ both }) => {
  await both.step("render the app again twice", async (page) => {
    await page.locator("#again").click()
    await page.locator("#again").click()
    await expect(page.locator("#again")).toHaveText("Render again (2)")
    const inline = (await calls(page)).filter(([name]) => name === "inline ref").map(([, what]) => what)
    expect(inline.at(-1)).toBe("attached")
  })
  await both.step("the roving group still moves between the stars", async (page) => {
    await star(page, 1).focus()
    await page.keyboard.press("ArrowRight")
    await expect(star(page, 2)).toBeFocused()
    await expect(star(page, 2)).toHaveAttribute("aria-checked", "true")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect(star(page, 1)).toBeFocused()
  })
})

test("a ref written inline hears the same attaches and detaches as in React", async ({ both }) => {
  await both.step("render the app again", async (page) => {
    await page.locator("#again").click()
    await expect(page.locator("#again")).toHaveText("Render again (1)")
    const inline = (await calls(page)).filter(([name]) => name === "inline ref").map(([, what]) => what)
    expect(inline).toEqual(["attached", "detached", "attached"])
  })
})

test("a new key remounts the part with fresh state", async ({ both }) => {
  await both.step("press, then remount", async (page) => {
    const part = page.locator("#remounted")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "true")
    await page.locator("#remount").click()
    await expect(part).toHaveText("Version 1")
    await expect(part).toHaveAttribute("aria-pressed", "false")
  })
  await both.step("what remounted works", async (page) => {
    const part = page.locator("#remounted")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "true")
    await page.locator("#remount").click()
    await page.locator("#remount").click()
    await expect(part).toHaveText("Version 3")
    await expect(part).toHaveAttribute("aria-pressed", "false")
  })
})

test("the same part in both arms of a condition keeps its instance and takes the new props", async ({ both }) => {
  await both.step("swap to the second arm", async (page) => {
    const part = page.locator("#branch")
    await expect(part).toHaveAttribute("aria-pressed", "true")
    await page.locator("#swap").click()
    await expect(part).toHaveText("Second branch")
    await expect(part).toHaveClass("second")
    // The default option only says where the state starts.
    await expect(part).toHaveAttribute("aria-pressed", "true")
  })
  await both.step("press, then swap back", async (page) => {
    const part = page.locator("#branch")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "false")
    await page.locator("#swap").click()
    await expect(part).toHaveText("First branch")
    await expect(part).toHaveAttribute("aria-pressed", "false")
  })
})
