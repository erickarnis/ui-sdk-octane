// Core's form controls. Checkbox, switch and toggle come from `createParts`;
// the radio group is written with `usePrimitive` and `usePart`.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const control = (page: Page, role: string, name: string) => page.getByRole(role as "checkbox", { name, exact: true })
const calls = (page: Page) => page.evaluate(() => window.calls)

test.beforeEach(async ({ both }) => {
  await both.open("controls")
})

test.describe("checkbox", () => {
  test("a click checks it: attributes, the indicator and the form input follow", async ({ both }) => {
    await both.step("unchecked", async (page) => {
      const terms = control(page, "checkbox", "Terms")
      await expect(terms).toHaveAttribute("aria-checked", "false")
      await expect(terms.locator("[data-slot=checkbox-indicator]")).toHaveCount(0)
      await expect(terms.locator("input")).not.toBeChecked()
    })
    await both.step("click", async (page) => {
      const terms = control(page, "checkbox", "Terms")
      await terms.click()
      await expect(terms).toHaveAttribute("aria-checked", "true")
      await expect(terms).toHaveAttribute("data-checked", "")
      await expect(terms.locator("[data-slot=checkbox-indicator]")).toHaveText("✓")
      await expect(terms.locator("input")).toBeChecked()
      expect(await calls(page)).toEqual([["terms onCheckedChange", true]])
    })
    await both.step("Space unchecks", async (page) => {
      const terms = control(page, "checkbox", "Terms")
      await terms.press("Space")
      await expect(terms).toHaveAttribute("aria-checked", "false")
      await expect(terms.locator("[data-slot=checkbox-indicator]")).toHaveCount(0)
      await expect(terms.locator("input")).not.toBeChecked()
    })
  })

  test("an option reaches every part: disabled", async ({ both }) => {
    await both.step("click", async (page) => {
      const disabled = page.locator("#checkbox [aria-label=Disabled]")
      await expect(disabled).toBeDisabled()
      await expect(disabled.locator("[data-slot=checkbox-indicator]")).toHaveAttribute("data-disabled", "")
      await disabled.click({ force: true })
      await expect(disabled).toHaveAttribute("aria-checked", "false")
    })
  })
})

test.describe("switch", () => {
  test("uncontrolled: a default option, then a click", async ({ both }) => {
    await both.step("click", async (page) => {
      const uncontrolled = control(page, "switch", "Uncontrolled")
      await expect(uncontrolled).toHaveAttribute("aria-checked", "true")
      await expect(uncontrolled.locator("input")).toBeChecked()
      await uncontrolled.click()
      await expect(uncontrolled).toHaveAttribute("aria-checked", "false")
      await expect(uncontrolled.locator("[data-slot=switch-thumb]")).toHaveAttribute("data-unchecked", "")
      await expect(uncontrolled.locator("input")).not.toBeChecked()
    })
  })

  test("controlled: a click asks the app and shows its answer", async ({ both }) => {
    await both.step("click twice", async (page) => {
      const controlled = control(page, "switch", "Controlled")
      await controlled.click()
      await expect(controlled).toHaveAttribute("aria-checked", "true")
      await controlled.click()
      await expect(controlled).toHaveAttribute("aria-checked", "false")
      expect(await calls(page)).toEqual([
        ["switch onCheckedChange", true],
        ["switch onCheckedChange", false],
      ])
    })
  })

  test("controlled: a value the app never changes stays", async ({ both }) => {
    await both.step("click twice", async (page) => {
      const stuck = control(page, "switch", "Stuck")
      await stuck.click()
      await stuck.click()
      await expect(stuck).toHaveAttribute("aria-checked", "false")
      expect(await calls(page)).toEqual([
        ["stuck onCheckedChange", true],
        ["stuck onCheckedChange", true],
      ])
    })
  })
})

test.describe("toggle", () => {
  test("a click presses, and a default option starts it pressed", async ({ both }) => {
    await both.step("click both", async (page) => {
      const bold = page.locator("#toggle [aria-label=Bold]")
      const italic = page.locator("#toggle [aria-label=Italic]")
      await expect(italic).toHaveAttribute("aria-pressed", "true")
      await bold.click()
      await italic.click()
      await expect(bold).toHaveAttribute("aria-pressed", "true")
      await expect(bold).toHaveAttribute("data-pressed", "")
      await expect(italic).toHaveAttribute("aria-pressed", "false")
      expect(await calls(page)).toEqual([["bold onPressedChange", true]])
    })
  })
})

test.describe("radio group", () => {
  const indicators = (page: Page) =>
    page.locator("#radio [role=radio]").evaluateAll((els) =>
      els.map((el) => (el.querySelector("[data-slot=radio-indicator]") ? "●" : "○")).join("")
    )

  test("an indicator inside a radio takes the radio's value, and shows for the chosen one", async ({ both }) => {
    await both.step("look", async (page) => {
      await expect(control(page, "radio", "Free")).toHaveAttribute("aria-checked", "true")
      // The disabled radio's indicator is kept mounted.
      expect(await indicators(page)).toBe("●○●")
    })
    await both.step("choose Paid", async (page) => {
      await control(page, "radio", "Paid").click()
      await expect(page.locator("#plan")).toHaveText("monthly")
      await expect(control(page, "radio", "Paid")).toHaveAttribute("aria-checked", "true")
      await expect(control(page, "radio", "Free")).toHaveAttribute("aria-checked", "false")
      await expect.poll(() => indicators(page)).toBe("○●●")
      expect(await calls(page)).toEqual([["plan onValueChange", "monthly"]])
    })
  })

  test("arrow keys move focus and choose, skipping the disabled radio", async ({ both }) => {
    await both.step("ArrowDown from Free", async (page) => {
      await control(page, "radio", "Free").focus()
      await page.keyboard.press("ArrowDown")
      await expect(control(page, "radio", "Paid")).toBeFocused()
      await expect(page.locator("#plan")).toHaveText("monthly")
      await expect(control(page, "radio", "Paid")).toHaveAttribute("tabindex", "0")
      await expect(control(page, "radio", "Free")).toHaveAttribute("tabindex", "-1")
    })
    await both.step("ArrowDown again loops past the disabled one", async (page) => {
      await page.keyboard.press("ArrowDown")
      await expect(control(page, "radio", "Free")).toBeFocused()
      await expect(page.locator("#plan")).toHaveText("free")
    })
  })

  test("a radio whose value changed checks when the group selects the new value", async ({ both }) => {
    await both.step("change the value, then choose it from outside", async (page) => {
      await page.locator("#yearly").click()
      await page.locator("#choose-yearly").click()
      await expect(page.locator("#plan")).toHaveText("yearly")
      await expect(control(page, "radio", "Paid")).toHaveAttribute("aria-checked", "true")
      await expect(control(page, "radio", "Free")).toHaveAttribute("aria-checked", "false")
      await expect.poll(() => indicators(page)).toBe("○●●")
    })
    await both.step("a click on it reports the new value", async (page) => {
      await control(page, "radio", "Free").click()
      await control(page, "radio", "Paid").click()
      expect(await calls(page)).toEqual([
        ["plan onValueChange", "free"],
        ["plan onValueChange", "yearly"],
      ])
    })
  })
})
