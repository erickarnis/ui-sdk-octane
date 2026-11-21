// Prints what keeps a detached part alive: drives upstream's leaks fixture the
// way leaks.spec.ts does, takes a heap snapshot through the DevTools protocol,
// and walks from the GC roots to each detached element with a `data-slot`,
// ignoring weak edges. Needs the conformance preview running (see ../run.mjs).
//
//   node probes/retainers.mjs menu [cycles] [toggles] [final] [origin]
//
// Opens and closes `cycles` times, clicks Toggle `toggles` times (even, to
// leave the component mounted), then opens and closes `final` times.
//
// Writes no files. The path printed is the shortest strong one, so it names
// one retainer; after fixing it, run again to see whether another remains.
import { chromium } from "playwright"

const popups = {
  menu: { trigger: "button", popup: "menu", open: "Enter", close: "Escape" },
  select: { trigger: "combobox", popup: "listbox", open: "Enter", close: "Escape" },
  combobox: { trigger: "combobox", popup: "listbox", open: "ArrowDown", close: "Escape" },
  autocomplete: { trigger: "combobox", popup: "listbox", open: "ArrowDown", close: "Escape" },
}
const [name = "menu", cycles = "20", toggles = "40", final = "1", origin = "http://localhost:4490"] = process.argv.slice(2)
const { trigger, popup, open, close } = popups[name]

const browser = await chromium.launch()
const page = await browser.newPage()
// Numbers each part as it enters the page, so the output can say which open
// made it.
await page.addInitScript(() => {
  let born = 0
  new MutationObserver((records) => {
    for (const { addedNodes } of records) {
      for (const node of addedNodes) {
        if (!(node instanceof Element)) continue
        for (const el of [node, ...node.querySelectorAll("[data-slot]")]) {
          if (el.hasAttribute("data-slot") && el.__leakProbeBorn === undefined) {
            el.__leakProbeBorn = born++
          }
        }
      }
    }
  }).observe(document, { childList: true, subtree: true })
})
await page.goto(`${origin}/?fixture=leaks&framework=react&component=${name}`)
await page.locator("body[data-mounted]").waitFor({ state: "attached" })
const cdp = await page.context().newCDPSession(page)

async function openAndClose(times) {
  const button = page.getByRole(trigger, { name: "Open", exact: true })
  await button.focus()
  for (let time = 0; time < times; time++) {
    await page.keyboard.press(open)
    await page.getByRole(popup).waitFor()
    await page.keyboard.press(close)
    await page.getByRole(popup).waitFor({ state: "hidden" })
  }
}
async function toggle(times) {
  await page.evaluate(async (times) => {
    const button = [...document.querySelectorAll("button")].find(
      ({ textContent }) => textContent === "Toggle"
    )
    for (let time = 0; time < times; time++) {
      button.click()
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    }
  }, times)
}

await openAndClose(Number(cycles))
await toggle(Number(toggles))
await openAndClose(Number(final))
await page.waitForTimeout(1500)
await cdp.send("HeapProfiler.collectGarbage")

// Tags each detached part with an object whose class names its slot, so the
// part can be found in the snapshot by that object's one retainer.
const { result } = await cdp.send("Runtime.evaluate", {
  expression: "HTMLElement.prototype",
  objectGroup: "probe",
})
const { objects } = await cdp.send("Runtime.queryObjects", {
  prototypeObjectId: result.objectId,
  objectGroup: "probe",
})
const { result: tagged } = await cdp.send("Runtime.callFunctionOn", {
  objectId: objects.objectId,
  functionDeclaration: `function () {
    // The class's name carries the slot and birth order into the snapshot.
    const tag = (el) => {
      const name = "LeakProbeTag " + el.dataset.slot + " #" + el.__leakProbeBorn
      return new ({ [name]: class {} })[name]()
    }
    const found = []
    for (const el of this) {
      try {
        if (!el.isConnected && el.hasAttribute("data-slot")) {
          el.__leakProbeTag = tag(el)
          found.push(el.dataset.slot + " #" + el.__leakProbeBorn)
        }
      } catch {}
    }
    return found.sort()
  }`,
  returnByValue: true,
})
await cdp.send("Runtime.releaseObjectGroup", { objectGroup: "probe" })
console.log("detached:", tagged.value.join(", ") || "none")

let chunks = ""
cdp.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => (chunks += chunk))
await cdp.send("HeapProfiler.collectGarbage")
await cdp.send("HeapProfiler.takeHeapSnapshot", { reportProgress: false })
await browser.close()

const snapshot = JSON.parse(chunks)
const { node_fields, edge_fields, node_types, edge_types } = snapshot.snapshot.meta
const nodeSize = node_fields.length
const edgeSize = edge_fields.length
const { nodes, edges, strings } = snapshot
const nType = node_fields.indexOf("type")
const nName = node_fields.indexOf("name")
const nEdges = node_fields.indexOf("edge_count")
const eType = edge_fields.indexOf("type")
const eName = edge_fields.indexOf("name_or_index")
const eTo = edge_fields.indexOf("to_node")
const nodeTypes = node_types[nType]
const edgeTypes = edge_types[eType]
const count = nodes.length / nodeSize
const firstEdge = new Uint32Array(count + 1)
for (let node = 0; node < count; node++) {
  firstEdge[node + 1] = firstEdge[node] + nodes[node * nodeSize + nEdges] * edgeSize
}
const label = (node) =>
  `${nodeTypes[nodes[node * nodeSize + nType]]} ${strings[nodes[node * nodeSize + nName]].slice(0, 120)}`
const edgeLabel = (edge) => {
  const type = edgeTypes[edges[edge + eType]]
  const raw = edges[edge + eName]
  return type === "element" || type === "hidden" ? `${type}[${raw}]` : `${type} ${strings[raw]}`
}

// Breadth first from the synthetic root over strong edges, so each node's
// parent is on a shortest strong path from a GC root.
const parent = new Int32Array(count).fill(-1)
const via = new Int32Array(count).fill(-1)
parent[0] = 0
const queue = [0]
for (let head = 0; head < queue.length; head++) {
  const node = queue[head]
  for (let edge = firstEdge[node]; edge < firstEdge[node + 1]; edge += edgeSize) {
    if (edgeTypes[edges[edge + eType]] === "weak") continue
    const to = edges[edge + eTo] / nodeSize
    if (parent[to] !== -1) continue
    parent[to] = node
    via[to] = edge
    queue.push(to)
  }
}

// Which parts something outside the detached parts holds, as opposed to parts
// held only through another detached part: walks again without entering any
// part, then looks for a reached node with a strong edge to one.
const tags = []
const partName = new Map()
for (let node = 0; node < count; node++) {
  if (
    strings[nodes[node * nodeSize + nName]].startsWith("LeakProbeTag ") &&
    nodeTypes[nodes[node * nodeSize + nType]] === "object" &&
    parent[node] !== -1
  ) {
    tags.push(parent[node])
    partName.set(parent[node], strings[nodes[node * nodeSize + nName]].slice("LeakProbeTag ".length))
  }
}
const parts = new Set(tags)
const reached = new Uint8Array(count)
const from = new Int32Array(count).fill(-1)
const fromEdge = new Int32Array(count).fill(-1)
reached[0] = 1
const again = [0]
for (let head = 0; head < again.length; head++) {
  const node = again[head]
  for (let edge = firstEdge[node]; edge < firstEdge[node + 1]; edge += edgeSize) {
    if (edgeTypes[edges[edge + eType]] === "weak") continue
    const to = edges[edge + eTo] / nodeSize
    if (reached[to] || parts.has(to)) continue
    reached[to] = 1
    from[to] = node
    fromEdge[to] = edge
    again.push(to)
  }
}
const held = new Map()
for (let node = 0; node < count; node++) {
  if (!reached[node]) continue
  for (let edge = firstEdge[node]; edge < firstEdge[node + 1]; edge += edgeSize) {
    if (edgeTypes[edges[edge + eType]] === "weak") continue
    const to = edges[edge + eTo] / nodeSize
    if (parts.has(to) && !held.has(to)) held.set(to, { node, edge })
  }
}
console.log("\nheld from outside the detached parts:")
const holders = new Set()
for (const part of tags) {
  const holder = held.get(part)
  if (!holder) {
    console.log(`  ${partName.get(part)}: only through another detached part`)
    continue
  }
  const steps = [`${label(holder.node)}  -[${edgeLabel(holder.edge)}]-> the part`]
  for (let at = holder.node; at !== 0; at = from[at]) {
    steps.push(`${label(from[at])}  -[${edgeLabel(fromEdge[at])}]->`)
  }
  const key = steps.join("\n")
  console.log(`  ${partName.get(part)}: ${holders.has(key) ? "same holder as above" : ""}`)
  if (holders.has(key)) continue
  holders.add(key)
  for (const step of steps.reverse()) console.log(`      ${step.slice(0, 220)}`)
}

const shown = new Set()
for (let node = 0; node < count; node++) {
  if (!strings[nodes[node * nodeSize + nName]].startsWith("LeakProbeTag ")) continue
  if (nodeTypes[nodes[node * nodeSize + nType]] !== "object") continue
  // The tag's holder is the element's wrapper.
  const element = parent[node]
  if (element === -1) {
    console.log("\nunreachable tag")
    continue
  }
  const path = []
  for (let at = element; at !== 0; at = parent[at]) {
    path.push(`${label(at)}  <-[${edgeLabel(via[at])}]-`)
  }
  const key = path.slice(1).join("\n")
  if (shown.has(key)) continue
  shown.add(key)
  console.log(`\n${partName.get(element)}: ${label(element).slice(0, 90)} (from the root, ${path.length} steps):`)
  for (const step of path.reverse()) console.log("  " + step)
}
