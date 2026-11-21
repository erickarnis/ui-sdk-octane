// Core's ready-made tabs, a primitive with a list, items and panels that
// come and go, rendered through `createParts`.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const tabsIn = (page: Page, root: string) => page.locator(`${root} [role=tab]`)
/** Each tab's aria-selected, in order: "true,false,false". */
const selected = (page: Page, root: string) =>
  tabsIn(page, root).evaluateAll((els) => els.map((el) => el.getAttribute("aria-selected")).join(","))
/** The text of the panels a person can see. */
const shownPanels = (page: Page, root: string) =>
  page.locator(`${root} [role=tabpanel]:not([hidden])`).allTextContents().then((texts) => texts.join("|"))
const labels = (page: Page, root: string) => tabsIn(page, root).allTextContents().then((texts) => texts.join(","))

test.describe("uncontrolled", () => {
  test.beforeEach(async ({ both }) => {
    await both.open("tabs")
  })

  test("the default value is selected, and only its panel is in the page", async ({ both }) => {
    await both.step("look", async (page) => {
      await expect.poll(() => selected(page, "#basic")).toBe("true,false,false")
      await expect(page.locator("#basic [role=tabpanel]")).toHaveCount(1)
      await expect(page.locator("#basic [role=tabpanel]")).toHaveText("Panel A")
      await expect(page.locator("#basic [role=tablist]")).toHaveAttribute("aria-label", "Sections")
    })
  })

  test("a click selects, and the old panel leaves as the new one arrives", async ({ both }) => {
    await both.step("click the second tab", async (page) => {
      await tabsIn(page, "#basic").nth(1).click()
      await expect.poll(() => selected(page, "#basic")).toBe("false,true,false")
      await expect(page.locator("#basic [role=tabpanel]")).toHaveCount(1)
      await expect(page.locator("#basic [role=tabpanel]")).toHaveText("Panel B")
      expect(await page.evaluate(() => window.calls)).toEqual([["basic onValueChange", "b", "item-press"]])
    })
  })

  test("className, style and children given as functions follow the part's state", async ({ both }) => {
    await both.step("before", async (page) => {
      const beta = tabsIn(page, "#basic").nth(1)
      await expect(beta).toHaveAttribute("class", "off")
      await expect(beta).toHaveCSS("font-weight", "400")
      await expect(beta).toHaveText("Beta")
    })
    await both.step("select it", async (page) => {
      const beta = tabsIn(page, "#basic").nth(1)
      await beta.click()
      await expect(beta).toHaveAttribute("class", "on")
      await expect(beta).toHaveCSS("font-weight", "700")
      await expect(beta).toHaveText("Beta (open)")
    })
    await both.step("select another", async (page) => {
      const beta = tabsIn(page, "#basic").nth(1)
      await tabsIn(page, "#basic").nth(0).click()
      await expect(beta).toHaveAttribute("class", "off")
      await expect(beta).toHaveText("Beta")
    })
  })

  test("arrow keys move focus and select, and loop at the ends", async ({ both }) => {
    await both.step("ArrowRight twice from the first tab", async (page) => {
      await tabsIn(page, "#basic").nth(0).focus()
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("ArrowRight")
      await expect(tabsIn(page, "#basic").nth(2)).toBeFocused()
      await expect.poll(() => selected(page, "#basic")).toBe("false,false,true")
      await expect.poll(() => shownPanels(page, "#basic")).toBe("Panel C")
    })
    await both.step("ArrowRight again loops to the first", async (page) => {
      await page.keyboard.press("ArrowRight")
      await expect(tabsIn(page, "#basic").nth(0)).toBeFocused()
      await expect.poll(() => selected(page, "#basic")).toBe("true,false,false")
    })
    await both.step("End, then Home", async (page) => {
      await page.keyboard.press("End")
      await expect(tabsIn(page, "#basic").nth(2)).toBeFocused()
      await page.keyboard.press("Home")
      await expect(tabsIn(page, "#basic").nth(0)).toBeFocused()
      await expect.poll(() => selected(page, "#basic")).toBe("true,false,false")
    })
  })

  test("a `render` element keeps its tag and props and takes the part's", async ({ both }) => {
    await both.step("look, then select it", async (page) => {
      const gamma = tabsIn(page, "#basic").nth(2)
      expect(await gamma.evaluate((el) => el.tagName)).toBe("A")
      await expect(gamma).toHaveAttribute("href", "#c")
      await expect(gamma).toHaveAttribute("data-custom", "yes")
      await expect(gamma).toHaveText("Gamma")
      await gamma.click()
      await expect(gamma).toHaveAttribute("aria-selected", "true")
    })
  })

  test("a tab's aria-controls names its panel, and the panel's aria-labelledby names the tab", async ({ both }) => {
    await both.step("select the third tab", async (page) => {
      const gamma = tabsIn(page, "#basic").nth(2)
      await gamma.click()
      const panel = page.locator("#basic [role=tabpanel]")
      await expect(panel).toHaveText("Panel C")
      expect(await gamma.getAttribute("aria-controls")).toBe(await panel.getAttribute("id"))
      expect(await panel.getAttribute("aria-labelledby")).toBe(await gamma.getAttribute("id"))
    })
  })

  test("the selected tab is the list's one tab stop", async ({ both }) => {
    await both.step("select the second, then read the stops", async (page) => {
      await tabsIn(page, "#basic").nth(1).click()
      const stops = await tabsIn(page, "#basic").evaluateAll((els) => els.map((el) => el.getAttribute("tabindex")).join(","))
      expect(stops).toBe("-1,0,-1")
    })
  })

  test("two instances on one page select on their own", async ({ both }) => {
    await both.step("select in the first", async (page) => {
      await tabsIn(page, "#basic").nth(1).click()
      await expect.poll(() => selected(page, "#basic")).toBe("false,true,false")
      await expect.poll(() => selected(page, "#manual")).toBe("true,false,false")
    })
    await both.step("select in the second", async (page) => {
      await tabsIn(page, "#manual").nth(2).click()
      await expect.poll(() => selected(page, "#manual")).toBe("false,false,true")
      await expect.poll(() => selected(page, "#basic")).toBe("false,true,false")
    })
  })

  test("options reach the instance: vertical, manual activation, no loop", async ({ both }) => {
    await both.step("ArrowDown moves focus without selecting, and skips nothing it shouldn't", async (page) => {
      const tabs = tabsIn(page, "#manual")
      await expect(page.locator("#manual [role=tablist]")).toHaveAttribute("aria-orientation", "vertical")
      await tabs.nth(0).focus()
      await page.keyboard.press("ArrowDown")
      await page.keyboard.press("ArrowDown")
      await expect(tabs.nth(2)).toBeFocused()
      await expect.poll(() => selected(page, "#manual")).toBe("true,false,false")
    })
    await both.step("ArrowDown at the end stays, and Enter selects", async (page) => {
      const tabs = tabsIn(page, "#manual")
      await page.keyboard.press("ArrowDown")
      await expect(tabs.nth(2)).toBeFocused()
      await page.keyboard.press("Enter")
      await expect.poll(() => selected(page, "#manual")).toBe("false,false,true")
    })
  })

  test("a slot prop like `disabled` reaches its part", async ({ both }) => {
    await both.step("click the disabled tab", async (page) => {
      const billing = tabsIn(page, "#manual").nth(1)
      await expect(billing).toHaveAttribute("aria-disabled", "true")
      await billing.click({ force: true })
      await expect.poll(() => selected(page, "#manual")).toBe("true,false,false")
    })
  })

  test("a panel with keepMounted stays in the page, hidden, while another shows", async ({ both }) => {
    await both.step("look", async (page) => {
      const panels = page.locator("#manual [role=tabpanel]")
      await expect(panels).toHaveCount(2)
      await expect(panels.nth(1)).toHaveText("Team settings")
      await expect(panels.nth(1)).toBeHidden()
      await expect.poll(() => shownPanels(page, "#manual")).toBe("Account settings")
    })
    await both.step("select it", async (page) => {
      await tabsIn(page, "#manual").nth(2).click()
      await expect.poll(() => shownPanels(page, "#manual")).toBe("Team settings")
      await expect(page.locator("#manual [role=tabpanel]")).toHaveCount(1)
    })
  })
})

test.describe("controlled", () => {
  test.beforeEach(async ({ both }) => {
    await both.open("tabs-controlled")
  })

  test("a click asks the app, and the app's value selects", async ({ both }) => {
    await both.step("click the second tab", async (page) => {
      await tabsIn(page, "#controlled").nth(1).click()
      await expect(page.locator("#value")).toHaveText("two")
      await expect.poll(() => selected(page, "#controlled")).toBe("false,true,false")
      await expect.poll(() => shownPanels(page, "#controlled")).toBe("Panel two")
      expect(await page.evaluate(() => window.calls)).toEqual([["onValueChange", "two", "item-press"]])
    })
  })

  test("a value set from outside selects", async ({ both }) => {
    await both.step("select three from outside", async (page) => {
      await page.locator("#select-three").click()
      await expect.poll(() => selected(page, "#controlled")).toBe("false,false,true")
      await expect.poll(() => shownPanels(page, "#controlled")).toBe("Panel three")
      const stops = await tabsIn(page, "#controlled").evaluateAll((els) => els.map((el) => el.getAttribute("tabindex")).join(","))
      expect(stops).toBe("-1,-1,0")
    })
  })

  test("a change the app refuses moves nothing but focus", async ({ both }) => {
    await both.step("lock, then click and arrow", async (page) => {
      await page.locator("#lock").click()
      await tabsIn(page, "#controlled").nth(1).click()
      await expect.poll(() => selected(page, "#controlled")).toBe("true,false,false")
      await expect.poll(() => shownPanels(page, "#controlled")).toBe("Panel one")
      await page.keyboard.press("ArrowRight")
      await expect(tabsIn(page, "#controlled").nth(2)).toBeFocused()
      await expect.poll(() => selected(page, "#controlled")).toBe("true,false,false")
      await expect(page.locator("#value")).toHaveText("one")
    })
  })

  test("a tab added to the list joins it", async ({ both }) => {
    await both.step("add a tab and select it with End", async (page) => {
      await page.locator("#add").click()
      await expect.poll(() => labels(page, "#controlled")).toBe("Tab one,Tab two,Tab three,Tab extra3")
      await tabsIn(page, "#controlled").nth(0).focus()
      await page.keyboard.press("End")
      await expect(page.locator("#value")).toHaveText("extra3")
      await expect.poll(() => shownPanels(page, "#controlled")).toBe("Panel extra3")
    })
  })

  test("removing the selected tab leaves the rest working", async ({ both }) => {
    await both.step("remove the first tab", async (page) => {
      await page.locator("#remove-first").click()
      await expect.poll(() => labels(page, "#controlled")).toBe("Tab two,Tab three")
      await expect(page.locator("#controlled [role=tabpanel]")).toHaveCount(0)
    })
    await both.step("select one that remains", async (page) => {
      await tabsIn(page, "#controlled").nth(0).click()
      await expect(page.locator("#value")).toHaveText("two")
      await expect.poll(() => selected(page, "#controlled")).toBe("true,false")
    })
  })

  test("reversing the tabs keeps the selection and reorders the arrow keys", async ({ both }) => {
    await both.step("reverse", async (page) => {
      await page.locator("#reverse").click()
      await expect.poll(() => labels(page, "#controlled")).toBe("Tab three,Tab two,Tab one")
      await expect.poll(() => selected(page, "#controlled")).toBe("false,false,true")
    })
    await both.step("ArrowLeft from the selected tab", async (page) => {
      await tabsIn(page, "#controlled").nth(2).focus()
      await page.keyboard.press("ArrowLeft")
      await expect(page.locator("#value")).toHaveText("two")
      await expect(tabsIn(page, "#controlled").nth(1)).toBeFocused()
    })
  })
})
