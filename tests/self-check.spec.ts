// The comparison itself: a fixture that differs between React and Octane on
// purpose must be reported, difference by difference, and nothing else.
import { expect, test } from "./lib/both"

test("the comparison reports attributes, text, children, form values, focus and callbacks", async ({ both }) => {
  await both.open("self-check", { compare: false })
  await both.react.locator("#first").focus()
  await both.octane.locator("#field").focus()
  const found = (await both.differences()).map(
    ({ at, what, react, octane }) => `${at} | ${what} | ${react} | ${octane}`
  )
  expect(found).toEqual([
    'main > p#attribute | attribute data-who | "react" | "octane"',
    'main > p#words | text | "Rendered by react" | "Rendered by octane"',
    "main > div#children | children | [i] | [b]",
    'main > input#field | attribute value | "react" | "octane"',
    'main > input#field | property value | "react" | "octane"',
    "(page) | focus | main > button#first | main > input#field",
    expect.stringContaining("(page) | visible text | "),
    '(app) | call 1 | ["who","react"] | ["who","octane"]',
  ])
})

test("ids a framework made compare by their relationships, not their spelling", async ({ both }) => {
  await both.open("self-check", { compare: false })
  for (const page of [both.react, both.octane]) {
    const made = await page.locator("#label").getAttribute("for")
    expect(made).toMatch(/^(_r_\w+_|:r[\w-]+:)$/)
    await expect(page.locator(`[id="${made}"]`)).toHaveAttribute("aria-describedby", `${made}-hint missing`)
  }
  const ids = (await both.differences()).filter(({ what }) => /attribute (for|id|aria-describedby)/.test(what))
  expect(ids).toEqual([])
})

test("a difference declared with both.allow is not reported", async ({ both }) => {
  both.allow({ at: "main > p#attribute", what: "attribute data-who", reason: "the fixture writes its adapter's name" })
  both.allow({ what: /^(text|children|visible text|call 1|attribute value|property value)$/, reason: "the same" })
  await both.open("self-check", { compare: false })
  expect(await both.differences()).toEqual([])
})
