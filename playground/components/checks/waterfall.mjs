export default async function waterfallChecks(t) {
  const rows = "#wf [data-slot=waterfall-row]"
  const shown = () => t.page.locator(rows).evaluateAll((els) => els.filter((el) => el.offsetParent !== null && !el.hidden).map((el) => el.id).join(","))
  t.eq("a named treegrid of rows", (await t.attr("#wf", "role")) + " " + (await t.attr("#wf", "aria-label")) + " " + (await t.attrs(rows, "role")), "treegrid Trace row,row,row,row")
  t.eq("rows say their level and whether they're expanded", (await t.attrs(rows, "aria-level")) + " " + (await t.attr("#wf-page", "aria-expanded")), "1,2,2,1 true")
  t.eq("the axis is hidden from screen readers and renders its ticks", (await t.attr("#wf-axis", "aria-hidden")) + " " + ((await t.count("#wf-axis [data-slot=waterfall-tick]")) > 1), "true true")
  t.check("a bar is a gridcell that says when its span runs", (await t.attr("#wf-page-bar", "role")) === "gridcell" && Boolean(await t.attr("#wf-page-bar", "aria-label")), await t.attr("#wf-page-bar", "aria-label"))
  t.eq("expanded, the children show", await shown(), "wf-page,wf-db,wf-render,wf-font")
  await t.page.click("#wf-page-indicator")
  t.eq("the indicator collapses its span", (await t.attr("#wf-page", "aria-expanded")) + " " + (await shown()), "false wf-page,wf-font")
  await t.page.focus("#wf-page")
  await t.press("ArrowRight")
  t.eq("ArrowRight expands", await t.attr("#wf-page", "aria-expanded"), "true")
  await t.press("ArrowDown")
  t.eq("ArrowDown moves to the next row", await t.page.evaluate(() => document.activeElement?.closest("[role=row]")?.id), "wf-db")
  await t.press("Enter")
  t.eq("Enter selects the row and reaches the app", (await t.text("#wf-value")) + " " + (await t.attr("#wf-db", "aria-selected")), "db true")
  t.eq("without children, it renders a row for every span", await t.page.locator("#auto [data-slot=waterfall-row-header]").evaluateAll((els) => els.map((el) => el.textContent.trim()).join(",")), "GET /,Query,Render,Font")
}
