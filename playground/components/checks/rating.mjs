export default async function ratingChecks(t) {
  const radios = "#r [role=radio]"
  // Which of the elements have the attribute, as 1s and 0s.
  const has = (selector, attribute) => t.page.locator(selector).evaluateAll((els, name) => els.map((el) => (el.hasAttribute(name) ? 1 : 0)).join(""), attribute)
  t.eq("a named radiogroup with a radio per star", (await t.attr("#r", "role")) + " " + (await t.attr("#r", "aria-label")) + " " + (await t.count(radios)), "radiogroup Stars 5")
  t.eq("the default checks its star, and fills the stars up to it", (await t.attrs(radios, "aria-checked")) + " " + (await has("#r [data-slot=rating-item]", "data-filled")), "false,false,true,false,false 11100")
  t.eq("one tab stop, on the checked star", await t.attrs(radios, "tabindex"), "-1,-1,0,-1,-1")
  await t.page.focus("#r [role=radio][aria-checked=true]")
  await t.press("ArrowRight")
  t.eq("ArrowRight checks the next star", await t.attrs(radios, "aria-checked"), "false,false,false,true,false")
  await t.page.locator(radios).nth(1).click()
  t.eq("a click checks its star", await t.attrs(radios, "aria-checked"), "false,true,false,false,false")
  await t.page.click("#r-form-submit")
  t.eq("the score submits under its name", await t.text("#r-form-sent"), "stars=2")
  await t.page.locator(radios).nth(1).click()
  t.eq("deselectable: pressing the checked star clears it", await t.attrs(radios, "aria-checked"), "false,false,false,false,false")
  await t.page.locator("#r [data-slot=rating-item]").nth(3).hover()
  t.eq("hovering previews up to that star", await has("#r [data-slot=rating-item]", "data-highlighted"), "11110")

  t.eq("half steps: two radios per star", await t.count("#cr [role=radio]"), 10)
  t.eq("controlled: children are a function of each star's state", await t.page.locator("#cr").evaluate((el) => [...el.querySelectorAll("[data-slot=rating-item]")].map((item) => item.textContent).join("")), "FFPEE")
  await t.page.focus("#cr [role=radio][aria-checked=true]")
  await t.press("ArrowRight")
  t.eq("controlled: a key press reaches the app", await t.text("#cr-value"), "3")
  await t.page.click("#cr-outside")
  t.eq("controlled: a value from outside shows", await has("#cr [data-slot=rating-item]", "data-filled"), "11110")

  t.eq("read-only: an image named by its score, without radios to press", (await t.attr("#ro", "role")) + " " + (await t.attr("#ro", "aria-label")) + " " + (await t.attrs("#ro [role=radio]", "aria-hidden")), "img " + (await t.attr("#ro", "aria-label")) + " true,true,true,true,true")
  t.eq("in a field: named by its label, with the field's name", (await t.attr("#fr", "aria-labelledby")) + " " + (await t.attr("#fr input", "name")), "fr-label quality")
}
