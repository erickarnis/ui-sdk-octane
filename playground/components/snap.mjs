// Prints a page's console problems and a compact DOM dump of #app.
import { chromium } from "playwright"
const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage()
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log(m.type() + ": " + m.text()) })
page.on("pageerror", (e) => console.log("pageerror: " + e.message + "\n" + (e.stack ?? "").split("\n").slice(0, 8).join("\n")))
await page.goto(url)
await page.waitForTimeout(600)
for (const step of process.argv.slice(3)) {
  const [kind, ...rest] = step.split(":")
  const arg = rest.join(":")
  if (kind === "click") await page.click(arg)
  else if (kind === "key") await page.keyboard.press(arg)
  else if (kind === "focus") await page.focus(arg)
  else if (kind === "hover") await page.hover(arg)
  else if (kind === "type") await page.keyboard.type(arg)
  else if (kind === "wait") await page.waitForTimeout(Number(arg))
  await page.waitForTimeout(150)
}
console.log(await page.evaluate(() => document.getElementById("app").innerHTML.replace(/<!--.*?-->/g, "")))
console.log("ACTIVE:", await page.evaluate(() => { const a = document.activeElement; return a ? a.tagName + "#" + a.id + " " + (a.textContent ?? "").slice(0, 30) : "none" }))
await browser.close()
