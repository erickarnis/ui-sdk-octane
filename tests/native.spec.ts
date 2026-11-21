// What only Octane does: attributes in the DOM's spelling, a style as text,
// and (checked here because it needs no React page) an asleep instance.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const calls = (page: Page) => page.evaluate(() => window.calls)

for (const id of ["lowercase", "camel"]) {
  test(`an attribute the part leaves to the app is the app's, in ${id} spelling`, async ({ both }) => {
    const page = await both.openOctane("native")
    const field = page.locator(`#${id}`)
    await expect(field).toHaveAttribute("autocomplete", "email")
    await expect(field).toHaveAttribute("spellcheck", "true")
    await expect(field).toHaveAttribute("inputmode", "text")
  })

  test(`an attribute the part owns stays the part's when the app's changes, in ${id} spelling`, async ({ both }) => {
    const page = await both.openOctane("native")
    const field = page.locator(`#${id}`)
    await expect(field).toHaveAttribute("tabindex", "-1")
    await page.locator("#again").click()
    await page.locator("#again").click()
    await expect(page.locator("#again")).toHaveText("Render again (2)")
    await expect(field).toHaveAttribute("tabindex", "-1")
  })
}

test("a style written as text keeps a `;` inside a value", async ({ both }) => {
  const page = await both.openOctane("native")
  const styled = page.locator("#styled")
  await expect(styled).toHaveCSS("color", "rgb(1, 2, 3)")
  expect(await styled.evaluate((el) => (el as HTMLElement).style.backgroundImage)).toContain(
    "base64,R0lGODlhAQABAAAAACw="
  )
})

test("rendering its parts leaves an asleep instance asleep, and a press wakes it", async ({ both }) => {
  const page = await both.openOctane("native")
  await page.locator("#again").click()
  expect((await calls(page)).filter(([name]) => name === "api built")).toEqual([])
  await page.locator("#first").click()
  await expect(page.locator("#second")).toHaveAttribute("data-presses", "1")
  expect((await calls(page)).filter(([name]) => name === "api built")).toHaveLength(1)
})
