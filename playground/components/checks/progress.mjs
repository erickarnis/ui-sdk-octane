export default async function progressChecks(t) {
  t.eq("a progressbar, named by its label", (await t.attr("#p", "role")) + " " + (await t.attr("#p", "aria-labelledby")), "progressbar " + (await t.attr("#p-label", "id")))
  t.eq("no value: indeterminate, with no aria-valuenow", (await t.attr("#p", "data-indeterminate")) + " " + (await t.attr("#p", "aria-valuenow")), " null")
  await t.page.click("#p-half")
  t.eq("a value: progressing", (await t.attr("#p", "aria-valuenow")) + " " + (await t.attr("#p", "data-progressing")) + " " + (await t.text("#p-value")), "50  50%")
  t.eq("the indicator follows the status", await t.attr("#p-indicator", "data-progressing"), "")
  await t.page.click("#p-done")
  t.eq("at the maximum: complete", (await t.attr("#p", "data-complete")) + " " + (await t.attr("#p-label", "data-complete")), " ")
}
