// The test fixture every spec uses. A test opens one fixture page in both
// adapters, the React one being the oracle, and drives them with the same
// steps:
//
//   test("a click presses the button", async ({ both }) => {
//     await both.open("mute")
//     await both.step("click", async (page) => {
//       await page.locator("#mute").click()
//       await expect(page.locator("#mute")).toHaveAttribute("aria-pressed", "true")
//     })
//   })
//
// A step runs against React first, so an expectation upstream doesn't meet is
// the test's mistake and fails even a test marked `test.fail`. Then it runs
// against Octane, and then the two pages are compared whole: every element,
// attribute, form value, the focused element, the visible text and the
// callbacks the app received (see ./snapshot.ts). A difference the adapters
// are meant to have is declared with `both.allow`; one that is declared and
// never shows fails the test too, so the list stays true.
import { expect, test as base, type Page } from "@playwright/test"
import { ports } from "../servers.mjs"
import { compare, describe } from "./compare"
import { takeSnapshot } from "./snapshot"

export type Adapter = "react" | "octane"
export type Lane = "dev" | "prod"

const origins: Record<Lane, Record<Adapter, string>> = {
  dev: {
    octane: `http://127.0.0.1:${ports.octaneDev}`,
    react: `http://127.0.0.1:${ports.reactDev}`,
  },
  prod: {
    octane: `http://127.0.0.1:${ports.octaneProd}`,
    react: `http://127.0.0.1:${ports.reactProd}`,
  },
}

type Allowed = {
  /** The element's path as a failure prints it, or a pattern. Any element when left out. */
  at?: string | RegExp
  /** What differs, as a failure prints it, like "attribute value", or a pattern. */
  what: string | RegExp
  /** Why the adapters are meant to differ here. */
  reason: string
}

const matches = (pattern: string | RegExp | undefined, value: string) =>
  pattern === undefined ||
  (typeof pattern === "string" ? pattern === value : pattern.test(value))

export class Both {
  #pages = new Map<Adapter, Page>()
  #allowed: (Allowed & { seen: boolean })[] = []
  #problems: string[] = []
  #expectedProblems: { adapter: Adapter; pattern: RegExp; seen: boolean }[] = []
  /** Set when the React page fails a step: the test is wrong, whatever it is marked. */
  oracleFailed = false

  constructor(
    private readonly lane: Lane,
    private readonly newPage: () => Promise<Page>
  ) {}

  get react() {
    return this.#page("react")
  }
  get octane() {
    return this.#page("octane")
  }

  #page(adapter: Adapter) {
    const page = this.#pages.get(adapter)
    if (!page) throw new Error(`Open a fixture before using the ${adapter} page.`)
    return page
  }

  async #load(adapter: Adapter, fixture: string) {
    const page = await this.newPage()
    this.#pages.set(adapter, page)
    const problem = (text: string) => {
      const expected = this.#expectedProblems.find(
        (entry) => entry.adapter === adapter && entry.pattern.test(text)
      )
      if (expected) expected.seen = true
      else this.#problems.push(`${adapter}: ${text}`)
    }
    page.on("pageerror", (error) => problem(`uncaught ${error.message}`))
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        problem(`console ${message.type()}: ${message.text()}`)
    })
    await page.goto(`${origins[this.lane][adapter]}/?fixture=${fixture}`)
    // The entry sets this once the fixture has rendered.
    await page.locator(`html[data-adapter="${adapter}"]`).waitFor()
    return page
  }

  /** Opens `tests/fixtures/<fixture>.tsx` in both adapters and compares the two pages. */
  async open(fixture: string, { compare = true } = {}) {
    await Promise.all([this.#load("react", fixture), this.#load("octane", fixture)])
    if (compare) await this.same("after opening")
  }

  /** Opens a fixture in Octane alone, for what has no React counterpart, like a list of refs. */
  async openOctane(fixture: string) {
    return this.#load("octane", fixture)
  }

  /** Declares a difference the adapters are meant to have. It must show at least once. */
  allow(allowed: Allowed) {
    this.#allowed.push({ ...allowed, seen: false })
  }

  /** Declares a console warning, console error or uncaught error the test causes on purpose. */
  expectProblem(adapter: Adapter, pattern: RegExp) {
    this.#expectedProblems.push({ adapter, pattern, seen: false })
  }

  /**
   * Runs the same actions and expectations against the React page, then the
   * Octane page, then compares the two pages.
   */
  async step(
    title: string,
    body: (page: Page, adapter: Adapter) => Promise<void>
  ) {
    await base.step(`react: ${title}`, async () => {
      try {
        await body(this.react, "react")
      } catch (error) {
        this.oracleFailed = true
        throw labelled(error, `React, the oracle, failed "${title}", so the test is wrong`)
      }
    })
    await base.step(`octane: ${title}`, async () => {
      try {
        await body(this.octane, "octane")
      } catch (error) {
        throw labelled(error, `Octane failed "${title}", which React passed`)
      }
    })
    await this.same(`after "${title}"`)
  }

  /** What differs between the two pages now, without the declared differences. */
  async differences() {
    const [react, octane] = await Promise.all([
      this.react.evaluate(takeSnapshot),
      this.octane.evaluate(takeSnapshot),
    ])
    return compare(react, octane).filter((difference) => {
      const allowed = this.#allowed.find(
        (entry) =>
          matches(entry.at, difference.at) && matches(entry.what, difference.what)
      )
      if (allowed) allowed.seen = true
      return !allowed
    })
  }

  /** Expects the two pages to be the same but for the declared differences. */
  async same(when: string) {
    await base.step(`compare ${when}`, async () => {
      // A page may still be settling: a part that lets go a microtask later,
      // or a change that renders on the next frame.
      await expect(async () => {
        const found = await this.differences()
        if (found.length)
          throw new Error(
            `Octane differs from React ${when}:\n\n    ${found.map(describe).join("\n\n    ")}\n`
          )
      }).toPass({ timeout: 2000, intervals: [25, 50, 100, 200] })
    })
  }

  /** After a test that passed: nothing unexpected in a console, nothing declared and unseen. */
  finish() {
    expect(this.#problems, "console problems and uncaught errors").toEqual([])
    expect(
      this.#allowed.filter((entry) => !entry.seen).map((entry) => `${entry.what}: ${entry.reason}`),
      "differences declared with both.allow that never showed"
    ).toEqual([])
    expect(
      this.#expectedProblems.filter((entry) => !entry.seen).map((entry) => `${entry.adapter}: ${entry.pattern}`),
      "problems declared with both.expectProblem that never showed"
    ).toEqual([])
  }

  get problems(): readonly string[] {
    return this.#problems
  }
}

function labelled(error: unknown, label: string) {
  if (error instanceof Error) error.message = `${label}.\n\n${error.message}`
  return error
}

export const test = base.extend<{ lane: Lane; both: Both }>({
  lane: ["dev", { option: true }],
  both: async ({ browser, lane }, use, testInfo) => {
    const context = await browser.newContext()
    const both = new Both(lane, () => context.newPage())
    await use(both)
    // A known Octane bug never excuses a step React fails.
    if (both.oracleFailed) testInfo.expectedStatus = "passed"
    else if (testInfo.errors.length === 0) both.finish()
    else if (both.problems.length)
      await testInfo.attach("console", { body: both.problems.join("\n") })
    await context.close()
  },
})

/**
 * Marks the test as one that fails today because of a bug in the adapter,
 * with the reason in a line. It passes while the bug is there and fails once
 * it's fixed, so the mark is removed with the fix. `TEST_SHOW_BUGS=1 pnpm test`
 * runs these as ordinary tests, to see each one's failure.
 */
export function knownBug(reason: string, when = true) {
  if (!process.env.TEST_SHOW_BUGS) test.fail(when, reason)
}

export { expect }
