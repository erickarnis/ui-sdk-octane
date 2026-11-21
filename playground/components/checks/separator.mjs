export default async function separatorChecks(t) {
  t.eq("a separator, horizontal", (await t.attr("#sep", "role")) + " " + (await t.attr("#sep", "data-orientation")), "separator horizontal")
  t.eq("vertical: says so to assistive technology", (await t.attr("#vsep", "aria-orientation")) + " " + (await t.attr("#vsep", "data-orientation")), "vertical vertical")
  t.eq("decorative: hidden from assistive technology", await t.attr("#dsep", "role"), "none")
  t.eq("render: the app's element takes the part", await t.page.locator("#rsep").evaluate((el) => el.tagName + " " + el.dataset.slot), "HR separator")
}
