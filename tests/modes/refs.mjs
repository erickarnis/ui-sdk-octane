// How a part holds its element. In Octane the part's ref alone lets go
// (`heldRef` in src/primitive.ts), where the React adapter also uses a layout
// cleanup, so these are the cases that cleanup covered: a ref the app replaces
// on every render, a part whose key changes while its element stays, and a
// part removed with its component.
import { withSite } from "./harness.mjs"

await withSite("a part's hold on its element", async ({ check, open }) => {
  const { page, problems } = await open("/p/refs?render=client")
  const read = () => page.evaluate(() => ({ ...window.modes.probeLog, inline: document.body.dataset.inline }))
  await page.waitForTimeout(150)
  let now = await read()
  check("mounted: the root and its item are bound once", now.bound === 1 && now.items.join(" ") === "+a", JSON.stringify(now))

  await page.click("#again")
  await page.click("#again")
  await page.waitForTimeout(150)
  now = await read()
  check("a ref the app replaces each render does not rebind the part", now.bound === 1 && now.unbound === 0 && now.inline === "attached", JSON.stringify(now))

  await page.click("#rekey")
  await page.waitForTimeout(150)
  now = await read()
  check("a part whose key changes lets go before the next part binds the element", now.items.join(" ") === "+a -a +b", now.items.join(" "))
  check("the element shows the new part", (await page.getAttribute("#item", "data-item")) === "b")

  await page.click("#remove")
  await page.waitForTimeout(150)
  now = await read()
  check("a removed part lets go in the commit that removes it", (await page.textContent("#at-commit")) === "+a -a +b -b", await page.textContent("#at-commit"))
  check("and only once", now.items.join(" ") === "+a -a +b -b", now.items.join(" "))
  check("nothing logged", problems.length === 0, problems.join(" || "))
})
