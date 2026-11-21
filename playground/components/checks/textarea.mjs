export default async function textareaChecks(t) {
  t.eq("a native textarea with its default value", await t.page.locator("#ta").evaluate((el) => el.tagName + " " + el.value), "TEXTAREA first")
  await t.page.click("#ta")
  await t.page.keyboard.press("End")
  await t.press("Enter")
  await t.page.keyboard.type("second")
  t.eq("without a shortcut, Enter adds a line", await t.page.inputValue("#ta"), "first\nsecond")
  await t.page.click("#ta-enter")
  await t.page.keyboard.type("hi")
  await t.press("Shift+Enter")
  await t.page.keyboard.type("there")
  t.eq("with the enter shortcut, Shift+Enter adds a line", await t.page.inputValue("#ta-enter"), "hi\nthere")
  await t.press("Enter")
  t.eq("and Enter submits its form", await t.text("#ta-form-sent"), "note=first%0Asecond&chat=hi%0Athere".replace(/%0A/g, "\n"))

  await t.page.click("#cta")
  await t.page.keyboard.type("hello")
  await t.press("Enter")
  t.eq("onSubmit gets the value, and the app empties it", (await t.text("#cta-sent")) + "|" + (await t.page.inputValue("#cta")), "hello|")

  const before = await t.page.locator("#grow").evaluate((el) => el.offsetHeight)
  await t.page.fill("#grow", "one\ntwo\nthree\nfour")
  await t.settle()
  const after = await t.page.locator("#grow").evaluate((el) => el.offsetHeight)
  t.check("autoResize: it grows with its text", after > before, `${before} -> ${after}`)

  t.eq("in a field: named by its label, with its name", (await t.attr("#bio", "aria-labelledby")) + " " + (await t.attr("#bio", "name")), "bio-label bio")
}
