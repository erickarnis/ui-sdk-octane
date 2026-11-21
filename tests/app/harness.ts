// What fixtures share with the tests: which adapter rendered the page, and a
// log of the callbacks the app received, which tests read as `window.calls`.
import { adapter } from "./adapter-name"

export { adapter }

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

declare global {
  interface Window {
    calls: Json[][]
    renders: Record<string, number>
  }
}

window.calls = []
window.renders = {}

// A change's details hold the event that caused it: keep what a test can
// compare, the reason and the event's type.
function plain(value: unknown): Json {
  if (value === undefined) return "<undefined>"
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return value
  if (value instanceof Event) return `<${value.type} event>`
  if (value instanceof Element) return `<${value.tagName.toLowerCase()}${value.id ? "#" + value.id : ""}>`
  if (typeof value === "function") return "<function>"
  if (Array.isArray(value)) return value.map(plain)
  if (typeof value === "object") {
    const result: { [key: string]: Json } = {}
    for (const [key, inner] of Object.entries(value)) {
      // React hands handlers its own event object around the browser's.
      if (key === "nativeEvent" && inner instanceof Event) return `<${inner.type} event>`
      if (inner !== undefined) result[key] = plain(inner)
    }
    return result
  }
  return String(value)
}

/** Records a callback the app received, by name, with its arguments. */
export function called(name: string, ...args: unknown[]) {
  window.calls.push([name, ...args.map(plain)])
}

/**
 * Counts a render, by name, in `window.renders`. Call it from a render or
 * children function. The two frameworks may render a different number of
 * times, so the comparison leaves counts out: a test reads what a step added.
 */
export function rendered(name: string) {
  window.renders[name] = (window.renders[name] ?? 0) + 1
}
