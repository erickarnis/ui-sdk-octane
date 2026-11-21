// The component entries that only re-export core: each resolves and works.
export default async function exportsChecks(t) {
  const out = async (name) => t.text("#x-" + name)
  t.eq("text-match: matchRanges finds the start", await out("text-match"), '[{"start":0,"end":3}]')
  t.check("gesture: rubberBand resists an overshoot", Number(await out("gesture")) > 0 && Number(await out("gesture")) < 10, await out("gesture"))
  t.eq("image: cropImage is a function", await out("image"), "function")
  t.eq("observe: observe is a function", await out("observe"), "function")
  t.eq("history: createHistory starts at no entries", await out("history"), "0")
  t.eq("agent: createAgent makes an agent that acts", await out("agent"), "function")
  t.eq("color: parseColor and formatColor round trip", await out("color"), "#ff0000")
  t.eq("number: stepBy steps on the grid", await out("number"), "1.5")
}
