export default async function asyncOptions(t) {
  const { page } = t
  const options = () => page.locator("#ao-list [role=option]").allTextContents().then((all) => all.join(","))
  t.eq("an immediate load shows as loading before it answers", (await t.text("#ao-status")) + " " + (await t.count("#ao-list [role=option]")), "loading 0")
  await page.waitForSelector("#ao-list [role=option]")
  t.eq("then shows every option and goes idle", (await t.text("#ao-status")) + " " + (await options()), "idle Ada,Alan,Barbara,Grace,Linus,Margaret")
  await page.fill("#ao-input", "a")
  await t.settle(20)
  await page.fill("#ao-input", "ar")
  t.eq("typing loads again", await t.text("#ao-status"), "loading")
  await t.settle(500)
  t.eq("the latest query wins over an older, slower one", (await t.text("#ao-query")) + " " + (await options()), "ar Barbara,Margaret")
  await page.click("#ao-reload")
  await t.settle(200)
  t.eq("reload loads the same query again", await page.evaluate(() => window.asyncCalls.slice(-1)[0]), "ar")
}
