export default async function preferencesChecks(t) {
  t.eq("its own element: display contents, its preference's attribute, the app's props", (await t.page.locator("#prefs").evaluate((el) => getComputedStyle(el).display + " " + el.style.color)) + " " + (await t.attr("#prefs", "data-density")) + " " + (await t.attr("#prefs", "data-slot")), "contents black comfortable preferences")
  t.eq("a global preference goes on <html>", await t.page.evaluate(() => document.documentElement.getAttribute("data-color-scheme")), "system")
  t.eq("a client render inserts no script", await t.count("#prefs script"), 0)
  t.eq("usePreference reads the value", await t.text("#density-value"), "comfortable")
  await t.page.click("#density-compact")
  t.eq("a change shows on the attribute and in usePreference", (await t.attr("#prefs", "data-density")) + " " + (await t.text("#density-value")), "compact compact")
  await t.page.click("#scheme-dark")
  t.eq("and on <html> for a global one", await t.page.evaluate(() => document.documentElement.getAttribute("data-color-scheme")), "dark")
  await t.page.reload()
  await t.page.waitForSelector("#prefs")
  t.eq("saved values come back on the next visit", (await t.attr("#prefs", "data-density")) + " " + (await t.text("#density-value")) + " " + (await t.page.evaluate(() => document.documentElement.getAttribute("data-color-scheme"))), "compact compact dark")
}
