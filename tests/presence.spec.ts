// Parts that come and go: a slot's `present` decides whether its part is in
// the page, and the parts around it keep pointing at it.
import type { Page } from "@playwright/test"
import { expect, test } from "./lib/both"

const trigger = (page: Page, section: string) => page.locator(`${section} button[aria-expanded]`)
const disclosurePanel = (page: Page, section: string) => page.locator(`${section} [data-slot=disclosure-panel]`)
const collapsiblePanel = (page: Page, section: string) => page.locator(`${section} [data-slot=collapsible-panel]`)

test.beforeEach(async ({ both }) => {
  await both.open("presence")
})

test("a part that isn't present renders nothing, then appears when its state says so", async ({ both }) => {
  await both.step("closed", async (page) => {
    await expect(disclosurePanel(page, "#plain")).toHaveCount(0)
    await expect(trigger(page, "#plain")).toHaveText("Show details")
  })
  await both.step("open", async (page) => {
    await trigger(page, "#plain").click()
    await expect(disclosurePanel(page, "#plain")).toHaveText("Details")
    await expect(trigger(page, "#plain")).toHaveAttribute("aria-expanded", "true")
    await expect(trigger(page, "#plain")).toHaveText("Hide details")
  })
  await both.step("close", async (page) => {
    await trigger(page, "#plain").click()
    await expect(disclosurePanel(page, "#plain")).toHaveCount(0)
    await expect(trigger(page, "#plain")).toHaveAttribute("aria-expanded", "false")
  })
})

test("a part present from the start leaves when its state says so, and comes back", async ({ both }) => {
  await both.step("close", async (page) => {
    await expect(disclosurePanel(page, "#starts-open")).toHaveText("Open from the start")
    await trigger(page, "#starts-open").click()
    await expect(disclosurePanel(page, "#starts-open")).toHaveCount(0)
  })
  await both.step("open again", async (page) => {
    await trigger(page, "#starts-open").click()
    await expect(disclosurePanel(page, "#starts-open")).toHaveText("Open from the start")
  })
})

test("a trigger points at the id its panel renders with", async ({ both }) => {
  await both.step("open", async (page) => {
    await trigger(page, "#plain").click()
    const id = await disclosurePanel(page, "#plain").getAttribute("id")
    expect(id).toBeTruthy()
    await expect(trigger(page, "#plain")).toHaveAttribute("aria-controls", id ?? "")
  })
})

test("an id the app writes on a part wins, and the parts that point at it follow", async ({ both }) => {
  await both.step("open", async (page) => {
    await trigger(page, "#own-id").click()
    await expect(disclosurePanel(page, "#own-id")).toHaveAttribute("id", "authors-panel")
    await expect(trigger(page, "#own-id")).toHaveAttribute("aria-controls", "authors-panel")
  })
})

test("controlled: the panel follows the app's value, from a press or from outside", async ({ both }) => {
  await both.step("press", async (page) => {
    await trigger(page, "#controlled").click()
    await expect(disclosurePanel(page, "#controlled")).toHaveText("Controlled panel")
    expect(await page.evaluate(() => window.calls)).toEqual([["onOpenChange", true, "press"]])
  })
  await both.step("close from outside", async (page) => {
    await page.locator("#open-outside").click()
    await expect(disclosurePanel(page, "#controlled")).toHaveCount(0)
    await expect(trigger(page, "#controlled")).toHaveAttribute("aria-expanded", "false")
  })
})

test("controlled: a refused change leaves the panel out of the page", async ({ both }) => {
  await both.step("lock, then press", async (page) => {
    await page.locator("#lock").click()
    await trigger(page, "#controlled").click()
    await expect(page.locator("#lock")).toHaveText("Unlock")
    await expect(disclosurePanel(page, "#controlled")).toHaveCount(0)
    await expect(trigger(page, "#controlled")).toHaveAttribute("aria-expanded", "false")
    expect(await page.evaluate(() => window.calls)).toEqual([["onOpenChange", true, "press"]])
  })
})

test("core's collapsible: the panel arrives with its attributes and leaves again", async ({ both }) => {
  await both.step("open", async (page) => {
    await expect(collapsiblePanel(page, "#collapsible")).toHaveCount(0)
    await trigger(page, "#collapsible").click()
    const panel = collapsiblePanel(page, "#collapsible")
    await expect(panel).toHaveText("Ships in two days.")
    await expect(panel).toHaveAttribute("data-open", "")
    await expect(trigger(page, "#collapsible")).toHaveAttribute("aria-controls", (await panel.getAttribute("id")) ?? "")
    await expect(page.locator("#collapsible [data-slot=collapsible]")).toHaveAttribute("data-open", "")
  })
  await both.step("close", async (page) => {
    await trigger(page, "#collapsible").click()
    await expect(collapsiblePanel(page, "#collapsible")).toHaveCount(0)
    await expect(page.locator("#collapsible [data-slot=collapsible]")).toHaveAttribute("data-closed", "")
    expect(await page.evaluate(() => window.calls)).toEqual([
      ["collapsible onOpenChange", true, "trigger-press"],
      ["collapsible onOpenChange", false, "trigger-press"],
    ])
  })
})

test("core's collapsible: a keepMounted panel stays in the page, hidden while closed", async ({ both }) => {
  await both.step("closed", async (page) => {
    await expect(collapsiblePanel(page, "#kept")).toHaveAttribute("hidden", "")
    await expect(collapsiblePanel(page, "#kept")).toHaveText("Thirty days.")
  })
  await both.step("open", async (page) => {
    await trigger(page, "#kept").click()
    await expect(collapsiblePanel(page, "#kept")).toBeVisible()
    await expect(collapsiblePanel(page, "#kept")).not.toHaveAttribute("hidden")
  })
  await both.step("close", async (page) => {
    await trigger(page, "#kept").click()
    await expect(collapsiblePanel(page, "#kept")).toHaveAttribute("hidden", "")
  })
})

test("core's collapsible: disabled, a press changes nothing", async ({ both }) => {
  await both.step("press", async (page) => {
    await expect(trigger(page, "#disabled")).toHaveAttribute("aria-disabled", "true")
    await trigger(page, "#disabled").click({ force: true })
    await expect(collapsiblePanel(page, "#disabled")).toHaveText("One year.")
    await expect(trigger(page, "#disabled")).toHaveAttribute("aria-expanded", "true")
  })
})
