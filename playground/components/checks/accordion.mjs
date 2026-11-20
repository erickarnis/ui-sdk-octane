export default async function accordion(t) {
  const triggers = "#acc-single [data-slot=accordion-trigger]"
  t.eq("first item open, others closed", await t.attrs(triggers, "aria-expanded"), "true,false,false")
  t.eq("only the open panel is in the page", await t.count("#acc-single [role=region]"), 1)
  const first = t.page.locator(triggers).nth(0)
  const panel = await first.getAttribute("aria-controls")
  t.eq("trigger controls its panel, which is labelled by it", await t.attr(`[id="${panel}"]`, "aria-labelledby"), await first.getAttribute("id"))
  t.eq("trigger sits in a heading", await first.evaluate((el) => el.parentElement.tagName), "H3")

  await t.page.locator(triggers).nth(1).click()
  t.eq("click opens the second and closes the first", await t.attrs(triggers, "aria-expanded"), "false,true,false")
  t.eq("its panel shows", await t.text("#acc-single [role=region]"), "Panel two")

  await t.press("Enter")
  t.eq("Enter on the focused trigger closes it", await t.attrs(triggers, "aria-expanded"), "false,false,false")
  await t.press("Space")
  t.eq("Space opens it again", await t.attrs(triggers, "aria-expanded"), "false,true,false")

  await t.press("Tab")
  t.eq("Tab reaches the disabled trigger, which stays focusable", await t.active(), await t.page.locator(triggers).nth(2).getAttribute("id"))
  t.eq("disabled trigger says so", await t.page.locator(triggers).nth(2).getAttribute("aria-disabled"), "true")
  await t.press("Enter")
  t.eq("disabled item stays closed", await t.attrs(triggers, "aria-expanded"), "false,true,false")

  const many = "#acc-multiple [data-slot=accordion-trigger]"
  t.eq("controlled: starts from the app's value", await t.attrs(many, "aria-expanded"), "true,false")
  t.eq("keepMounted panel stays in the page, hidden", await t.attr("#acc-multiple [role=region] >> nth=1", "hidden"), "")
  await t.page.locator(many).nth(1).click()
  t.eq("multiple: both open", await t.attrs(many, "aria-expanded"), "true,true")
  t.eq("the app heard the change", await t.text("#acc-value"), "a,b")
  await t.page.click("#acc-set")
  t.eq("a value set from outside shows", await t.attrs(many, "aria-expanded"), "false,true")
}
