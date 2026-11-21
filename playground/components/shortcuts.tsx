/** @jsxImportSource octane */
import { useRef, useState } from "octane"
import { formatShortcut, shortcuts, useShortcut, useShortcutHint } from "../../src/components/shortcuts"

function Counter({ keys, label }: { keys: string; label: string }) {
  const [count, setCount] = useState(0)
  const [enabled, setEnabled] = useState(true)
  // A handler that changes every render: the latest one runs.
  useShortcut(keys, () => setCount(count + 1), { description: label, when: () => enabled })
  const hint = useShortcutHint(keys)
  return (
    <p>
      <kbd id={label + "-hint"} aria-keyshortcuts={hint.ariaKeyshortcuts}>
        {hint.text}
      </kbd>
      <output id={label + "-count"}>{String(count)}</output>
      <button id={label + "-toggle"} type="button" onClick={() => setEnabled(!enabled)}>
        Toggle
      </button>
    </p>
  )
}

function Layered() {
  const panel = useRef<HTMLDivElement | null>(null)
  const [hits, setHits] = useState(0)
  useShortcut("x", () => setHits(hits + 1), { layer: panel })
  return (
    <div ref={panel} id="layer-panel">
      <output id="layer-count">{String(hits)}</output>
    </div>
  )
}

export function ShortcutsPage() {
  const [mounted, setMounted] = useState(true)
  const [listed, setListed] = useState("")
  return (
    <main id="page-shortcuts">
      {mounted ? <Counter keys="mod+k" label="search" /> : null}
      <button id="unmount" type="button" onClick={() => setMounted(false)}>
        Unmount
      </button>
      <input id="field" aria-label="Field" />
      <Layered />
      <output id="formatted">{formatShortcut("shift+a", false)}</output>
      <button id="list" type="button" onClick={() => setListed(shortcuts.list().map((shortcut) => shortcut.keys).join(","))}>
        List
      </button>
      <output id="listed">{listed}</output>
    </main>
  )
}
