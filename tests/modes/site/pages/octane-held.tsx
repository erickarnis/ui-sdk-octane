/** @jsxImportSource octane */
// Octane alone, no parts: what a transition that suspends does to the effects
// and refs of what is already on screen. The adapter's parts let go of their
// element in a layout cleanup, so they depend on the answer.
import { Suspense, startTransition, use, useEffect, useLayoutEffect, useState } from "octane"

const log: string[] = []
declare global {
  interface Window {
    heldLog: string[]
    openHeld: () => void
  }
}
window.heldLog = log
let open = () => {}
window.openHeld = () => open()

// One ref per name that keeps its identity, as a part's ref does.
const stable = new Map<string, (el: HTMLElement | null) => void>()
function stableRef(name: string) {
  let ref = stable.get(name)
  if (!ref) {
    ref = (el) => {
      log.push(`${name} ref ${el ? "attached" : "detached"}`)
    }
    stable.set(name, ref)
  }
  return ref
}

function Watched(props: { name: string; children?: unknown }) {
  useLayoutEffect(() => {
    log.push(`${props.name} layout`)
    return () => {
      log.push(`${props.name} layout cleanup`)
    }
  }, [])
  useEffect(() => {
    log.push(`${props.name} passive`)
    return () => {
      log.push(`${props.name} passive cleanup`)
    }
  }, [])
  return (
    <div ref={stableRef(props.name)}>
      {props.name}
      {props.children}
    </div>
  )
}

function Content(props: { from: Promise<string> }) {
  return <span>{use(props.from)}</span>
}

const ready = Promise.resolve("ready")

export function Page() {
  const [from, setFrom] = useState(ready)
  return (
    <main>
      <button
        id="go"
        type="button"
        onClick={() =>
          startTransition(() =>
            setFrom(
              new Promise<string>((resolve) => {
                open = () => {
                  resolve("loaded")
                }
              })
            )
          )
        }
      >
        Suspend in a transition
      </button>
      <Watched name="outside" />
      <Suspense fallback={<p>Loading</p>}>
        <Watched name="sibling" />
        <Watched name="around">
          <Content from={from} />
        </Watched>
      </Suspense>
    </main>
  )
}
