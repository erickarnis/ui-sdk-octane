// The `render` prop, and class names, styles and children that are functions
// of the part's state.
import { expect, test } from "./lib/both"

const tagOf = (el: Element) => el.tagName.toLowerCase()

test.beforeEach(async ({ both }) => {
  await both.open("render")
})

test("render as an element: its tag and props stay, and the part's merge in", async ({ both }) => {
  await both.step("look", async (page) => {
    const part = page.locator("#as-element")
    expect(await part.evaluate(tagOf)).toBe("a")
    await expect(part).toHaveAttribute("href", "#as-element")
    await expect(part).toHaveAttribute("data-own", "yes")
    await expect(part).toHaveAttribute("data-slot", "mute-button")
    await expect(part).toHaveAttribute("aria-pressed", "false")
    await expect(part).toHaveText("As element")
  })
  await both.step("class names combine, and the element's styles win over the app's", async (page) => {
    const part = page.locator("#as-element")
    await expect(part).toHaveClass("from-app from-element")
    await expect(part).toHaveCSS("color", "rgb(0, 0, 255)")
    expect(await part.evaluate((el: HTMLElement) => [el.style.left, el.style.top])).toEqual(["1px", "2px"])
  })
})

test("render as an element: its handler runs first, then the app's, then the part's", async ({ both }) => {
  await both.step("click", async (page) => {
    await page.locator("#as-element").click()
    await expect(page.locator("#as-element")).toHaveAttribute("aria-pressed", "true")
    expect(await page.evaluate(() => window.calls)).toEqual([["element's onClick"], ["app's onClick"]])
  })
})

test("render as an element: preventDefault() in its handler skips the app's and the part's", async ({ both }) => {
  await both.step("click", async (page) => {
    await page.locator("#element-prevents").click()
    await expect(page.locator("#element-prevents")).toHaveAttribute("aria-pressed", "false")
    expect(await page.evaluate(() => window.calls)).toEqual([["element's onClick prevents"]])
  })
})

test("render as an element: its own children and id win over the part's", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect(page.locator("#element-children")).toHaveText("The element's own children")
    await expect(page.locator("#element-id")).toHaveText("Id from the element")
    await expect(page.locator("#replaced-by-element")).toHaveCount(0)
  })
})

test("render as an element: an id on it is the one other parts point at", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect(page.locator("#panel-id section#rendered-panel")).toHaveText("Panel")
    await expect(page.locator("#panel-id button")).toHaveAttribute("aria-controls", "rendered-panel")
  })
})

test("render as a function: it gets the part's props and state, and decides the element", async ({ both }) => {
  await both.step("look", async (page) => {
    const part = page.locator("#as-function")
    expect(await part.evaluate(tagOf)).toBe("span")
    await expect(part).toHaveAttribute("data-muted", "false")
    await expect(part).toHaveAttribute("aria-pressed", "false")
    await expect(part).toHaveClass("from-app")
    await expect(part).toHaveText("As function")
  })
  await both.step("click", async (page) => {
    const part = page.locator("#as-function")
    await part.click()
    await expect(part).toHaveAttribute("data-muted", "true")
    await expect(part).toHaveAttribute("aria-pressed", "true")
  })
})

test("render as a function: class, style and children functions are resolved before it runs", async ({ both }) => {
  await both.step("before", async (page) => {
    const part = page.locator("#functions")
    await expect(part).toHaveClass("is-live")
    await expect(part).toHaveCSS("opacity", "1")
    await expect(part).toHaveText("Live")
    await expect(part).toHaveAttribute("data-state", "live")
  })
  await both.step("after a press", async (page) => {
    const part = page.locator("#functions")
    await part.click()
    await expect(part).toHaveClass("is-muted")
    await expect(part).toHaveCSS("opacity", "0.5")
    await expect(part).toHaveText("Muted")
    await expect(part).toHaveAttribute("data-state", "muted")
  })
})

test("render as a function may return the app's own component", async ({ both }) => {
  await both.step("click", async (page) => {
    const part = page.locator("#as-component")
    await expect(part).toHaveAttribute("data-fancy", "yes")
    await expect(page.locator(".fancy-frame > #as-component")).toHaveCount(1)
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "true")
  })
})

test("a part whose `render` changes between renders keeps its instance's state", async ({ both }) => {
  await both.step("press as a tag", async (page) => {
    const part = page.locator("#switch-target")
    expect(await part.evaluate(tagOf)).toBe("button")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "true")
  })
  await both.step("switch to an element", async (page) => {
    const part = page.locator("#switch-target")
    await page.locator("#switch").click()
    await expect(part).toHaveText("Rendered as element")
    expect(await part.evaluate(tagOf)).toBe("a")
    await expect(part).toHaveAttribute("aria-pressed", "true")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "false")
  })
  await both.step("switch to a function", async (page) => {
    const part = page.locator("#switch-target")
    await page.locator("#switch").click()
    await expect(part).toHaveText("Rendered as function")
    expect(await part.evaluate(tagOf)).toBe("em")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "true")
  })
  await both.step("switch back to the tag", async (page) => {
    const part = page.locator("#switch-target")
    await page.locator("#switch").click()
    expect(await part.evaluate(tagOf)).toBe("button")
    await expect(part).toHaveAttribute("aria-pressed", "true")
    await part.click()
    await expect(part).toHaveAttribute("aria-pressed", "false")
  })
})
