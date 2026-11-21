/** @jsxImportSource octane */
// Controlled parts changed inside transitions, a transition that suspends and
// is then finished or superseded, and parts whose content suspends.
import { Suspense, startTransition, use, useState, useTransition } from "octane"
import { Probe, Rating, Star } from "../parts"

type Gate = { promise: Promise<string>; open: () => void }
function gate(text: string): Gate {
  let open = () => {}
  const promise = new Promise<string>((resolve) => {
    open = () => {
      resolve(text)
    }
  })
  return { promise, open }
}
const ready = Promise.resolve("ready")
const gates: Gate[] = []
declare global {
  interface Window {
    // Settles the newest pending content, for the driver.
    openGate: () => void
  }
}
window.openGate = () => gates.at(-1)?.open()

function Content(props: { from: Promise<string> }) {
  return <span class="content">{use(props.from)}</span>
}

function Plain() {
  const [on, setOn] = useState(false)
  const [stars, setStars] = useState(1)
  const [pending, start] = useTransition()
  return (
    <section id="plain">
      <Probe id="plain-probe" on={on} onOnChange={setOn}>{on ? "On" : "Off"}</Probe>
      <button id="plain-flip" type="button" onClick={() => startTransition(() => setOn(!on))}>
        Flip in a transition
      </button>
      <Rating id="plain-stars" aria-label="Rating" value={stars} onValueChange={(next) => start(() => setStars(next))}>
        {["1", "2", "3"].map((value) => (
          <Star key={value} value={value} aria-label={value + " stars"}>★</Star>
        ))}
      </Rating>
      <output id="plain-value" data-pending={String(pending)}>{stars}</output>
    </section>
  )
}

// The probe and the content that suspends are siblings under one boundary
// that already shows them, so a transition that suspends keeps them on screen.
function Held() {
  const [on, setOn] = useState(false)
  const [from, setFrom] = useState(ready)
  const [log, setLog] = useState<string[]>([])
  const pend = () => {
    const next = gate(`loaded ${gates.length + 1}`)
    gates.push(next)
    return next.promise
  }
  return (
    <section id="held">
      <button
        id="held-go"
        type="button"
        onClick={() =>
          startTransition(() => {
            setOn(true)
            setFrom(pend())
          })
        }
      >
        Turn on with new content, in a transition
      </button>
      <button
        id="held-supersede"
        type="button"
        onClick={() => {
          setOn(false)
          setFrom(ready)
        }}
      >
        Go back, urgently
      </button>
      <button id="held-urgent" type="button" onClick={() => setFrom(pend())}>
        New content, urgently
      </button>
      <button id="held-outside" type="button" onClick={() => setOn(!on)}>
        Flip from outside
      </button>
      <Suspense fallback={<p id="held-fallback">Loading</p>}>
        <Probe
          id="held-probe"
          on={on}
          onOnChange={(next) => {
            setLog((all) => [...all, `${on}>${next}`])
            setOn(next)
          }}
        >
          <Content from={from} />
        </Probe>
      </Suspense>
      <output id="held-log">{log.join(",")}</output>
    </section>
  )
}

// Suspended from its first render: the part's own content waits.
function First() {
  const [from] = useState(() => {
    const first = gate("first content")
    gates.push(first)
    return first.promise
  })
  return (
    <section id="first">
      <Suspense fallback={<p id="first-fallback">Loading</p>}>
        <Probe id="first-probe" defaultOn>
          <Content from={from} />
        </Probe>
      </Suspense>
    </section>
  )
}

export function Page() {
  const [first, setFirst] = useState(false)
  return (
    <main>
      <Plain />
      <Held />
      <button id="show-first" type="button" onClick={() => setFirst(true)}>Mount a suspended part</button>
      <button id="hide-first" type="button" onClick={() => setFirst(false)}>Unmount it</button>
      {first && <First />}
    </main>
  )
}
