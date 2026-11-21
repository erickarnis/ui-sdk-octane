// `mergeProps` and `renderElement`, the two exports that work without a
// primitive: later props win, class names, styles, refs and handlers combine.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const calls = (page: Page) => page.evaluate(() => window.calls)
/** What handlers recorded, without the ref call every mount records. */
const handled = async (page: Page) => (await calls(page)).filter(([name]) => name !== "callback ref")

test.beforeEach(async ({ both }) => {
  // React joins class names into one string as it merges. Octane hands its
  // renderer the list, which composes it, so the element's class is the same.
  both.allow({
    at: "main > pre#raw",
    what: "text",
    reason: "mergeProps returns className as a list in Octane and a string in React",
  })
  both.allow({ at: "(page)", what: "visible text", reason: "the same list, in the page's text" })
  // Upstream joins the two as text, so the element's class is the function's
  // source. The port keeps a function, as upstream does for styles.
  both.allow({
    at: "main > p#class-function",
    what: "attribute class",
    reason: "a class function merged with a class name stays a function in Octane",
  })
  await both.open("merge")
})

test("a later prop wins, and undefined never replaces a value", async ({ both }) => {
  await both.step("look", async (page) => {
    const merged = page.locator("#later-wins")
    await expect(merged).toHaveAttribute("title", "kept")
    await expect(merged).toHaveAttribute("data-earlier", "yes")
    await expect(merged).toHaveAttribute("data-later", "yes")
    await expect(page.locator("#earlier-id")).toHaveCount(0)
  })
})

test("class names combine in order, skipping undefined", async ({ both }) => {
  await both.step("look", async (page) => {
    await expect(page.locator("#classes")).toHaveAttribute("class", "one two three")
  })
})

test("styles merge, and the later source wins a property both set", async ({ both }) => {
  await both.step("look", async (page) => {
    const style = await page.locator("#styles").evaluate((el: HTMLElement) => [el.style.color, el.style.left, el.style.top])
    expect(style).toEqual(["blue", "1px", "2px"])
  })
})

test("a class, style or children function of state resolves against the state given", async ({ both }) => {
  await both.step("idle", async (page) => {
    const merged = page.locator("#functions")
    await expect(merged).toHaveAttribute("class", "is-idle")
    await expect(merged).toHaveCSS("opacity", "1")
    await expect(merged).toHaveText("Idle")
  })
  await both.step("pressed", async (page) => {
    const merged = page.locator("#functions")
    await page.locator("#press").click()
    await expect(merged).toHaveAttribute("class", "is-pressed")
    await expect(merged).toHaveCSS("opacity", "0.5")
    await expect(merged).toHaveText("Pressed")
  })
})

test("a style function of state survives a merge with a plain style", async ({ both }) => {
  await both.step("press", async (page) => {
    const merged = page.locator("#functions")
    await expect(merged).toHaveCSS("color", "rgb(0, 128, 0)")
    await page.locator("#press").click()
    await expect(merged).toHaveCSS("opacity", "0.5")
    await expect(merged).toHaveCSS("color", "rgb(0, 128, 0)")
  })
})

test("Octane only: a class function of state survives a merge with a class name", async ({ both }) => {
  const merged = both.octane.locator("#class-function")
  await expect(merged).toHaveAttribute("class", "is-idle always")
  await both.octane.locator("#press").click()
  await expect(merged).toHaveAttribute("class", "is-pressed always")
})

test("handlers all run, the latest source first", async ({ both }) => {
  await both.step("click", async (page) => {
    await page.locator("#handlers").click()
    expect(await handled(page)).toEqual([["third source"], ["second source"], ["first source"]])
  })
})

test("preventDefault() in a later source's handler skips the earlier ones", async ({ both }) => {
  await both.step("click", async (page) => {
    await page.locator("#prevented").click()
    expect(await handled(page)).toEqual([["third source"], ["second source prevents"]])
  })
})

test("a callback ref and an object ref both get the element, and both let go of it", async ({ both }) => {
  await both.step("mounted", async (page) => {
    await page.locator("#read").click()
    expect(await calls(page)).toEqual([
      ["callback ref", "<span#refs>"],
      ["object ref holds", "<span#refs>"],
    ])
  })
  await both.step("unmounted", async (page) => {
    await page.locator("#toggle").click()
    await expect(page.locator("#refs")).toHaveCount(0)
    await page.locator("#read").click()
    expect((await calls(page)).slice(2)).toEqual([
      ["callback ref", null],
      ["object ref holds", null],
    ])
  })
})

test("refs stay attached through a render that changes nothing about them", async ({ both }) => {
  await both.step("render again", async (page) => {
    await page.locator("#press").click()
    await expect(page.locator("#functions")).toHaveText("Pressed")
    await page.locator("#read").click()
    expect((await calls(page)).at(-1)).toEqual(["object ref holds", "<span#refs>"])
  })
})

test("renderElement with an element: its props merge over the given ones, its handler first", async ({ both }) => {
  await both.step("click", async (page) => {
    const rendered = page.locator("#as-element")
    expect(await rendered.evaluate((el) => el.tagName)).toBe("A")
    await expect(rendered).toHaveAttribute("class", "from-props from-element")
    await expect(rendered).toHaveText("As element")
    await rendered.click()
    expect(await handled(page)).toEqual([["element's onClick"], ["props' onClick"]])
  })
})

test("renderElement with a function: it gets resolved props and the state", async ({ both }) => {
  await both.step("press", async (page) => {
    const rendered = page.locator("#as-function")
    expect(await rendered.evaluate((el) => el.tagName)).toBe("EM")
    await expect(rendered).toHaveAttribute("class", "off")
    await page.locator("#press").click()
    await expect(rendered).toHaveAttribute("class", "on")
    await expect(rendered).toHaveAttribute("data-pressed", "true")
  })
})

test("what mergeProps returns: the one declared difference is the class list", async ({ both }) => {
  await both.step("read", async (page, adapter) => {
    const raw = JSON.parse((await page.locator("#raw").textContent()) ?? "")
    expect(raw).toEqual({
      className: adapter === "react" ? "a b" : ["a", "b"],
      style: { color: "red", top: 0 },
      id: "y",
    })
  })
})

test("a __proto__ key in a source never reaches Object.prototype", async ({ both }) => {
  await both.step("read", async (page) => {
    expect(JSON.parse((await page.locator("#proto").textContent()) ?? "")).toEqual(["a", false])
  })
})
