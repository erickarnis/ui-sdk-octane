// Finds what differs between the React page's snapshot and the Octane page's.
import type { Snapshot, SnapshotNode } from "./snapshot"

export type Difference = {
  /** The element's path, or "(page)" for focus and text, "(app)" for callbacks. */
  at: string
  /** What differs there: "attribute aria-selected", "children", "text", "focus", "call 2". */
  what: string
  react: string
  octane: string
}

const show = (value: unknown) =>
  value === undefined ? "(none)" : JSON.stringify(value)

const kind = (node: SnapshotNode) =>
  typeof node === "string" ? "#text" : node.tag

function compareNodes(
  at: string,
  react: SnapshotNode[],
  octane: SnapshotNode[],
  differences: Difference[]
) {
  const kinds = (nodes: SnapshotNode[]) => nodes.map(kind).join(", ")
  if (kinds(react) !== kinds(octane)) {
    // Different elements: what is inside them can't be told apart further.
    differences.push({
      at,
      what: "children",
      react: `[${kinds(react)}]`,
      octane: `[${kinds(octane)}]`,
    })
    return
  }
  react.forEach((ours, index) => {
    const theirs = octane[index]
    if (typeof ours === "string" || typeof theirs === "string") {
      if (ours !== theirs)
        differences.push({ at, what: "text", react: show(ours), octane: show(theirs) })
      return
    }
    if (!theirs) return
    for (const group of ["attributes", "properties"] as const) {
      const names = new Set([...Object.keys(ours[group]), ...Object.keys(theirs[group])])
      for (const name of [...names].sort()) {
        if (ours[group][name] === theirs[group][name]) continue
        differences.push({
          at: ours.path,
          what: `${group === "attributes" ? "attribute" : "property"} ${name}`,
          react: show(ours[group][name]),
          octane: show(theirs[group][name]),
        })
      }
    }
    compareNodes(ours.path, ours.children, theirs.children, differences)
  })
}

export function compare(react: Snapshot, octane: Snapshot) {
  const differences: Difference[] = []
  compareNodes("(page)", react.body, octane.body, differences)
  if (react.focus !== octane.focus)
    differences.push({ at: "(page)", what: "focus", react: react.focus, octane: octane.focus })
  if (react.text !== octane.text)
    differences.push({ at: "(page)", what: "visible text", react: show(react.text), octane: show(octane.text) })
  const calls = Math.max(react.calls.length, octane.calls.length)
  for (let index = 0; index < calls; index++) {
    const ours = show(react.calls[index])
    const theirs = show(octane.calls[index])
    if (ours !== theirs)
      differences.push({ at: "(app)", what: `call ${index + 1}`, react: ours, octane: theirs })
  }
  return differences
}

export const describe = (difference: Difference) =>
  `${difference.at}: ${difference.what}\n      react:  ${difference.react}\n      octane: ${difference.octane}`
