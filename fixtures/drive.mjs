// Checks a consumer fixture's page in a headless browser: the adapter's parts
// render, their hooks keep state, and the page logs no error or warning.
// Written like tests/drive.mjs. On its own: node fixtures/drive.mjs <url>
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

/**
 * @param {string} url
 * @returns {Promise<{ ok: boolean, lines: string[] }>} one line per check
 */
export async function drive(url) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const problems = []
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      problems.push(message.type() + ": " + message.text())
    }
  })
  page.on("pageerror", (error) => {
    const stack = (error.stack ?? "").split("\n").slice(0, 6).join("\n")
    problems.push("pageerror: " + error.message + "\n" + stack)
  })

  const lines = []
  const check = (name, ok, detail = "") =>
    lines.push(`${ok ? "ok  " : "FAIL"} ${name}${detail ? " — " + detail : ""}`)
  const attr = (selector, name) => page.locator(selector).getAttribute(name)

  try {
    await page.goto(url)
    // An island mounts after its script loads, so wait for the first part. A
    // server-rendered island is in the page before that, and Astro drops its
    // `ssr` attribute once it has hydrated.
    await page.waitForSelector("#mute", { timeout: 30_000 })
    await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"), null, {
      timeout: 30_000,
    })

    // A toggle: one part, state inside the primitive.
    check(
      "toggle renders a button with type and aria-pressed",
      (await attr("#mute", "type")) === "button" &&
        (await attr("#mute", "aria-pressed")) === "false"
    )
    await page.click("#mute")
    check("toggle: click presses", (await attr("#mute", "aria-pressed")) === "true")
    await page.focus("#mute")
    await page.keyboard.press("Space")
    check("toggle: Space releases", (await attr("#mute", "aria-pressed")) === "false")

    // A controlled toggle: the app's state and the adapter's hooks agree.
    await page.click("#controlled")
    check(
      "controlled toggle: the press reaches the app and comes back",
      (await attr("#controlled", "aria-pressed")) === "true" &&
        (await page.textContent("#controlled")) === "Unmute" &&
        (await page.textContent("#muted")) === "true",
      `${await attr("#controlled", "aria-pressed")} / ${await page.textContent("#muted")}`
    )
    check(
      "toggles keep separate state",
      (await attr("#mute", "aria-pressed")) === "false"
    )

    // usePrimitive and usePart called from the app's own component.
    await page.click("#hand")
    check(
      "hand-written part: usePrimitive and usePart toggle",
      (await attr("#hand", "aria-pressed")) === "true"
    )

    // Tabs from @ui-sdk/core/tabs.
    const selected = () =>
      page
        .locator("#tabs [role=tab]")
        .evaluateAll((tabs) =>
          tabs.map((tab) => tab.getAttribute("aria-selected")).join(",")
        )
    const panels = () =>
      page
        .locator("#tabs [role=tabpanel]")
        .evaluateAll((all) =>
          all
            .filter((panel) => !panel.hidden)
            .map((panel) => panel.textContent)
            .join("|")
        )
    check(
      "tabs: first selected, one panel shown",
      (await selected()) === "true,false,false" && (await panels()) === "Panel A",
      `${await selected()} / ${await panels()}`
    )
    await page.locator("#tabs [role=tab]").nth(1).click()
    check(
      "tabs: click selects",
      (await selected()) === "false,true,false" && (await panels()) === "Panel B",
      `${await selected()} / ${await panels()}`
    )
    await page.keyboard.press("ArrowRight")
    check(
      "tabs: ArrowRight moves on",
      (await selected()) === "false,false,true" && (await panels()) === "Panel C",
      `${await selected()} / ${await panels()}`
    )
    const controls = await page
      .locator("#tabs [role=tab]")
      .nth(2)
      .getAttribute("aria-controls")
    check(
      "tabs: aria-controls names the shown panel",
      !!controls &&
        (await page.locator(`[id="${controls}"]`).textContent()) === "Panel C",
      String(controls)
    )
    check(
      "a component that reads its children: the closed select shows its value's label",
      (await page.textContent("#select-value"))?.trim() === "Banana",
      String(await page.textContent("#select-value"))
    )
    await page.focus("#select")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowUp")
    await page.keyboard.press("Enter")
    check(
      "a component that reads its children: the keyboard picks another item",
      (await page.textContent("#select-value"))?.trim() === "Apple",
      String(await page.textContent("#select-value"))
    )
    await page.click("#switch")
    check(
      "a component by its own entry: the switch turns on",
      (await attr("#switch", "aria-checked")) === "true",
      String(await attr("#switch", "aria-checked"))
    )
  } catch (error) {
    lines.push("FAIL threw: " + String(error?.message ?? error).split("\n")[0])
  }

  check("no console errors or warnings", problems.length === 0)
  if (problems.length) lines.push("PROBLEMS\n" + problems.join("\n"))
  await browser.close()
  return { ok: !lines.some((line) => line.startsWith("FAIL")), lines }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.argv[2]
  if (!url) {
    console.error("usage: node fixtures/drive.mjs <url>")
    process.exit(2)
  }
  const { ok, lines } = await drive(url)
  console.log(lines.join("\n"))
  process.exit(ok ? 0 : 1)
}
