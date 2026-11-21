export default async function passwordInputChecks(t) {
  t.eq("a password field with its default value", (await t.attr("#pw-in", "type")) + " " + (await t.page.inputValue("#pw-in")), "password hunter2")
  t.eq("the root's form attributes reach the input", (await t.attr("#pw-in", "name")) + " " + (await t.attr("#pw-in", "autocomplete")), "password current-password")
  t.eq("the toggle is a toggle button that controls the input", (await t.attr("#pw-toggle", "aria-pressed")) + " " + (await t.attr("#pw-toggle", "aria-controls")), "false " + (await t.attr("#pw-in", "id")))
  await t.page.click("#pw-toggle")
  t.eq("the toggle shows the password", (await t.attr("#pw-in", "type")) + " " + (await t.attr("#pw-toggle", "aria-pressed")) + " " + (await t.attr("#pw", "data-visible")), "text true ")
  await t.page.click("#pw-toggle")
  t.eq("and hides it", await t.attr("#pw-in", "type"), "password")
  await t.page.click("#pw-icon")
  t.eq("a press on the root's own content focuses the field", await t.active(), "pw-in")
  await t.page.click("#pw-form-submit")
  t.eq("it submits its value", await t.text("#pw-form-sent"), "password=hunter2")

  await t.page.click("#cpw-in")
  await t.page.keyboard.type("abc")
  await t.page.click("#cpw-toggle")
  t.eq("controlled: value and visibility reach the app", await t.text("#cpw-value"), "abc|true")
  t.eq("controlled: shows what the app says", (await t.page.inputValue("#cpw-in")) + " " + (await t.attr("#cpw-in", "type")), "abc text")

  t.eq("in a field: named by its label, with the field's name", (await t.attr("#fpw-in", "aria-labelledby")) + " " + (await t.attr("#fpw-in", "name")), "fpw-label pin")
  await t.page.click("#fpw-label")
  t.eq("in a field: its label focuses it", await t.active(), "fpw-in")
}
