// A one-part primitive: state it owns, state the app owns, changes the app
// refuses, a part written by hand, and parts that mount and unmount.
import { expect, test } from "./lib/both"

test.beforeEach(async ({ both }) => {
  await both.open("mute")
})

test("the root renders its slot's attributes and keeps the app's class", async ({ both }) => {
  await both.step("look", async (page) => {
    const mute = page.locator("#mute")
    await expect(mute).toHaveAttribute("type", "button")
    await expect(mute).toHaveAttribute("aria-pressed", "false")
    await expect(mute).toHaveAttribute("data-slot", "mute-button")
    await expect(mute).toHaveAttribute("class", "plain")
    await expect(mute).toHaveText("Mute")
  })
})

test("uncontrolled: a click, Space and Enter each toggle", async ({ both }) => {
  await both.step("click", async (page) => {
    await page.locator("#mute").click()
    await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "true")
  })
  await both.step("Space", async (page) => {
    await page.locator("#mute").press("Space")
    await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "false")
  })
  await both.step("Enter", async (page) => {
    await page.locator("#mute").press("Enter")
    await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "true")
  })
})

test("uncontrolled: a default option sets where the state starts", async ({ both }) => {
  await both.step("toggle", async (page) => {
    const button = page.locator("#starts-muted")
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })
})

test("two instances of one primitive keep their own state", async ({ both }) => {
  await both.step("press the second", async (page) => {
    await page.locator("#second").click()
    await expect(page.locator("#second")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "false")
  })
  await both.step("press the first", async (page) => {
    await page.locator("#mute").click()
    await page.locator("#second").click()
    await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#second")).toHaveAttribute("aria-pressed", "false")
  })
})

test("an element prop like `disabled` reaches the element and stops the press", async ({ both }) => {
  await both.step("click", async (page) => {
    const button = page.locator("#disabled")
    await expect(button).toBeDisabled()
    await button.click({ force: true })
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })
})

test("controlled: a press reaches the app and comes back as the new value", async ({ both }) => {
  await both.step("click", async (page) => {
    const button = page.locator("#controlled")
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await expect(button).toHaveText("Unmute")
  })
  await both.step("the app heard its own handler, then the change", async (page) => {
    expect(await page.evaluate(() => window.calls)).toEqual([
      ["onClick"],
      ["onMutedChange", true, "press"],
    ])
  })
})

test("controlled: a change from outside shows", async ({ both }) => {
  await both.step("flip from outside twice", async (page) => {
    const button = page.locator("#controlled")
    await page.locator("#outside").click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await page.locator("#outside").click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })
})

test("controlled: a change the app doesn't apply leaves the state where it was", async ({ both }) => {
  await both.step("lock, then press", async (page) => {
    const button = page.locator("#controlled")
    await page.locator("#lock").click()
    await button.click()
    await expect(page.locator("#lock")).toHaveText("Unlock")
    await expect(button).toHaveAttribute("aria-pressed", "false")
    expect(await page.evaluate(() => window.calls)).toContainEqual(["onMutedChange", true, "press"])
  })
  await both.step("unlock, then press", async (page) => {
    await page.locator("#lock").click()
    await page.locator("#controlled").click()
    await expect(page.locator("#controlled")).toHaveAttribute("aria-pressed", "true")
  })
})

test("uncontrolled: details.cancel() in the change callback refuses the change", async ({ both }) => {
  await both.step("refuse a press", async (page) => {
    const button = page.locator("#refuser")
    await page.locator("#refuse").click()
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })
  await both.step("accept the next", async (page) => {
    const button = page.locator("#refuser")
    await page.locator("#refuse").click()
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    expect(await page.evaluate(() => window.calls)).toEqual([
      ["onMutedChange", true, "refused"],
      ["onMutedChange", true, "accepted"],
    ])
  })
})

test("preventDefault() in the app's handler skips the part's own", async ({ both }) => {
  await both.step("click", async (page) => {
    const button = page.locator("#prevented")
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "false")
    expect(await page.evaluate(() => window.calls)).toEqual([["prevented click"]])
  })
})

test("a part written with usePrimitive and usePart toggles, with a class that follows its state", async ({ both }) => {
  await both.step("click", async (page) => {
    const button = page.locator("#hand")
    await expect(button).toHaveAttribute("class", "hand")
    await button.click()
    await expect(button).toHaveAttribute("aria-pressed", "true")
    await expect(button).toHaveAttribute("class", "hand muted")
  })
})

test("a part that unmounts leaves the page and returns with fresh state", async ({ both }) => {
  await both.step("press it", async (page) => {
    await page.locator("#mounted").click()
    await expect(page.locator("#mounted")).toHaveAttribute("aria-pressed", "true")
  })
  await both.step("unmount", async (page) => {
    await page.locator("#toggle-mount").click()
    await expect(page.locator("#mounted")).toHaveCount(0)
  })
  await both.step("mount again", async (page) => {
    await page.locator("#toggle-mount").click()
    await expect(page.locator("#mounted")).toHaveAttribute("aria-pressed", "false")
  })
  await both.step("press what returned", async (page) => {
    await page.locator("#mounted").click()
    await expect(page.locator("#mounted")).toHaveAttribute("aria-pressed", "true")
  })
})
