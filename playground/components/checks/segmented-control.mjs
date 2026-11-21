export default async function segmentedControlChecks(t) {
  t.eq("a radiogroup of radios, named", (await t.attr("#sc", "role")) + " " + (await t.attrs("#sc [data-slot=segmented-control-item]", "role")) + " " + (await t.attr("#sc", "aria-label")), "radiogroup radio,radio,radio,radio Size")
  t.eq("the default is checked from the first render", await t.attrs("#sc [data-slot=segmented-control-item]", "aria-checked"), "false,true,false,false")
  t.eq("one tab stop, on the checked item; the disabled one is natively disabled", (await t.attrs("#sc [data-slot=segmented-control-item]", "tabindex")) + " " + (await t.attr("#sc-l", "disabled")), "-1,0,,-1 ")
  t.check("the indicator is measured to the checked item", ((await t.attr("#sc-indicator", "style")) ?? "").includes("--segmented-control-indicator-"), await t.attr("#sc-indicator", "style"))
  await t.page.focus("#sc-m")
  await t.press("ArrowRight")
  t.eq("ArrowRight skips the disabled item and checks the next", (await t.active()) + " " + (await t.attr("#sc-xl", "aria-checked")), "sc-xl true")
  await t.press("ArrowRight")
  t.eq("arrows wrap", await t.active(), "sc-s")
  await t.page.click("#sc-m")
  await t.page.click("#sc-form-submit")
  t.eq("the checked value submits under its name", await t.text("#sc-form-sent"), "size=m")
  await t.page.click("#sc-l", { force: true })
  t.eq("a disabled item can't be checked", await t.attr("#sc-l", "aria-checked"), "false")

  t.eq("the indicator says which way it moved", await t.attr("#sc-indicator", "data-activation-direction"), "right")

  t.eq("controlled: starts from the app's value", await t.attr("#csc-grid", "aria-checked"), "true")
  await t.page.click("#csc-list")
  t.eq("controlled: a press reaches the app", (await t.text("#csc-value")) + " " + (await t.attr("#csc-list", "aria-checked")), "list true")
  await t.page.click("#csc-outside")
  t.eq("controlled: a value from outside checks its item", await t.attr("#csc-board", "aria-checked"), "true")

  t.eq("in a field: named by its label, with the field's name", (await t.attr("#fsc", "aria-labelledby")) + " " + (await t.attr("#page-segmented-control [data-slot=field] input", "name")), "fsc-label align")
}
