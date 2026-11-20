// Drives each component page in Chromium and prints what it found:
//   node playground/components/drive.mjs [base-url] [page ...]
// The pages are served by `vite --config playground/components/vite.config.ts`
// (development) or by `vite preview` after `vite build` with it (production).
// It is a verification driver, not a test suite: each check says what it saw.
import { readdirSync } from "node:fs"
import { chromium } from "playwright"

const base = process.argv[2] ?? "http://127.0.0.1:4431/"
const here = new URL("./checks/", import.meta.url)
const all = readdirSync(here)
  .filter((file) => file.endsWith(".mjs"))
  .map((file) => file.slice(0, -4))
  .sort()
const names = process.argv.length > 3 ? process.argv.slice(3) : all

const browser = await chromium.launch()
let failed = 0
for (const name of names) {
  const { default: run } = await import(new URL(`${name}.mjs`, here).href)
  const context = await browser.newContext()
  const page = await context.newPage()
  const problems = []
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on("pageerror", (error) => {
    problems.push(
      `pageerror: ${error.message}\n${(error.stack ?? "").split("\n").slice(0, 6).join("\n")}`
    )
  })
  const results = []
  const check = (label, ok, detail = "") => {
    if (!ok) failed++
    results.push(`${ok ? "ok  " : "FAIL"} ${name}: ${label}${detail === "" ? "" : ` — ${detail}`}`)
  }
  const t = {
    page,
    check,
    // Passes when `actual` is `expected`, and says what it was either way.
    eq: (label, actual, expected) => {
      check(label, actual === expected, actual === expected ? "" : `got ${JSON.stringify(actual)}, wanted ${JSON.stringify(expected)}`)
    },
    attr: (selector, attribute) => page.locator(selector).first().getAttribute(attribute),
    text: async (selector) => ((await page.locator(selector).first().textContent()) ?? "").trim(),
    count: (selector) => page.locator(selector).count(),
    visible: async (selector) =>
      (await page.locator(selector).count()) > 0 && (await page.locator(selector).first().isVisible()),
    press: async (key) => {
      await page.keyboard.press(key)
      await page.waitForTimeout(40)
    },
    // The focused element: its id, or else its text.
    active: () =>
      page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return "body"
        return el.id || (el.textContent ?? "").trim().slice(0, 40)
      }),
    attrs: (selector, attribute) =>
      page.locator(selector).evaluateAll((els, name) => els.map((el) => el.getAttribute(name)).join(","), attribute),
    settle: (ms = 80) => page.waitForTimeout(ms),
  }
  try {
    await page.goto(`${base}?page=${name}`)
    await page.waitForSelector(`#page-${name}`)
    await page.waitForTimeout(200)
    await run(t)
  } catch (error) {
    failed++
    results.push(`THREW ${name}: ${String(error.message).split("\n")[0]}`)
  }
  for (const problem of problems) {
    failed++
    results.push(`PROBLEM ${name}: ${problem}`)
  }
  console.log(results.join("\n"))
  await context.close()
}
await browser.close()
console.log(failed ? `${failed} failed` : "all passed")
process.exit(failed ? 1 : 0)
