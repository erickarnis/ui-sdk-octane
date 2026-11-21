export default async function avatarChecks(t) {
  await t.page.waitForFunction(() => document.querySelector("#ok")?.getAttribute("data-loading-status") !== "loading", null, { timeout: 2000 }).catch(() => {})
  t.eq("a loaded image shows and the fallback goes", (await t.visible("#ok-img")) + " " + (await t.count("#ok-fallback")), "true 0")
  t.eq("the app hears it load", await t.text("#ok-statuses"), "loaded")
  t.eq("the image keeps its alt text", await t.attr("#ok-img", "alt"), "Ada")
  await t.page.waitForTimeout(300)
  t.eq("a broken image: the fallback shows instead, and the image is hidden", (await t.visible("#broken-fallback")) + " " + (await t.attr("#broken-img", "aria-hidden")) + " " + (await t.attr("#broken", "data-loading-status")), "true true error")
  t.eq("a delayed fallback waits", await t.count("#late-fallback"), 0)
  await t.page.waitForSelector("#late-fallback", { timeout: 3000 }).catch(() => {})
  t.eq("then shows", await t.text("#late-fallback"), "LT")
}
