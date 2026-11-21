export default async function labelChecks(t) {
  t.eq("a native label, by for", await t.page.locator("#in-label").evaluate((el) => el.tagName + " " + el.htmlFor + " " + el.dataset.slot), "LABEL in label")
  await t.page.click("#in-label")
  t.eq("a press on it focuses its input", await t.active(), "in")
  await t.page.click("#wrap-label")
  t.eq("wrapping: a press checks the input inside", await t.page.isChecked("#wrapped"), true)
  await t.page.click("#sw-label")
  t.eq("a press on it toggles a switch", await t.attr("#sw", "aria-checked"), "true")
  t.eq("a control a label can't reach takes it as its name", await t.attr("#grid", "aria-labelledby"), "grid-label")
  await t.page.dblclick("#in-label")
  t.eq("a double click selects none of its text", await t.page.evaluate(() => String(getSelection())), "")
}
