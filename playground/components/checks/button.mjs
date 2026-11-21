export default async function buttonChecks(t) {
  t.eq("a native button, type button", await t.page.locator("#b").evaluate((el) => el.tagName + " " + el.type), "BUTTON button")
  await t.page.click("#b")
  await t.page.focus("#b")
  await t.press("Enter")
  await t.press("Space")
  t.check("the app's onClick gets the native event and how it was pressed", (await t.text("#b-log")).startsWith("click:"), await t.text("#b-log"))
  t.eq("each press reaches it once", (await t.text("#b-log")).split(",").length, 3)

  await t.page.click("#slow")
  t.eq("a promise makes it pending", (await t.attr("#slow", "aria-busy")) + " " + (await t.attr("#slow", "aria-disabled")) + " " + (await t.attr("#slow", "data-pending")), "true true ")
  t.eq("pending keeps focus", await t.active(), "slow")
  await t.page.click("#slow-settle")
  await t.settle()
  t.eq("settled, it's ready again", (await t.attr("#slow", "aria-busy")) + " " + (await t.attr("#slow", "data-pending")), "null null")

  await t.page.click("#off", { force: true })
  t.eq("disabled: natively, and presses don't reach the app", (await t.attr("#off", "disabled")) + " " + (await t.text("#b-log")).includes("disabled"), " false")
  t.eq("focusable when disabled: aria-disabled instead", (await t.attr("#focusable-off", "aria-disabled")) + " " + (await t.attr("#focusable-off", "disabled")), "true null")

  await t.page.click("#link")
  t.eq("a link through render: stays a link and is pressed", (await t.page.evaluate(() => location.hash)) + " " + (await t.text("#b-log")).includes("link"), "#linked true")
  t.eq("a div through render: role button and focusable", (await t.attr("#div", "role")) + " " + (await t.attr("#div", "tabindex")), "button 0")

  await t.page.click("#b-submit")
  t.eq("type submit submits its form", await t.text("#b-form-sent"), "q=x")
}
