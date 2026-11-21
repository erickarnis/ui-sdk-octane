export default async function meterChecks(t) {
  t.eq("a meter, named by its label", (await t.attr("#m", "role")) + " " + (await t.attr("#m", "aria-labelledby")), "meter " + (await t.attr("#m-label", "id")))
  t.eq("its value and bounds", ["aria-valuenow", "aria-valuemin", "aria-valuemax"].map((a) => a).length && (await t.attr("#m", "aria-valuenow")) + " " + (await t.attr("#m", "aria-valuemin")) + " " + (await t.attr("#m", "aria-valuemax")), "40 0 100")
  t.eq("the value shows formatted", await t.text("#m-value"), "40%")
  t.check("the indicator is as wide as the value", ((await t.attr("#m-indicator", "style")) ?? "").includes("40"), await t.attr("#m-indicator", "style"))
  await t.page.click("#m-more")
  t.eq("a new value from the app shows", (await t.attr("#m", "aria-valuenow")) + " " + (await t.text("#m-value")), "65 65%")
  t.eq("children as a function of the state", await t.text("#g-value"), "3 of 8 GB")
}
