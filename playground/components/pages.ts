/// <reference types="vite/client" />
import type { OctaneNode } from "octane"

// Every `<name>.tsx` beside this file is the page for the component of that
// name: its export whose name ends in `Page`. Nothing is listed by hand, so
// adding a component adds a file and touches no other.
const modules = import.meta.glob<Record<string, unknown>>(
  // Not the entry, which imports this file.
  ["./*.tsx", "!./main.tsx"],
  { eager: true }
)

// By the export's name: the compiler may wrap the function itself.
const isComponent = (value: unknown): value is () => OctaneNode =>
  typeof value === "function"

export const pages: Record<string, () => OctaneNode> = Object.fromEntries(
  Object.entries(modules).flatMap(([path, module]) => {
    const page = Object.entries(module).find(([name]) => name.endsWith("Page"))
    return page && isComponent(page[1])
      ? [[path.replace(/^\.\/|\.tsx$/g, ""), page[1]]]
      : []
  })
)
