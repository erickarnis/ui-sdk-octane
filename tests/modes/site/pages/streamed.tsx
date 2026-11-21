/** @jsxImportSource octane */
// Parts behind a Suspense boundary whose content arrives late, for streaming
// renders: tabs inside the boundary, and a part whose own content waits.
import { Suspense, use } from "octane"
import { Probe, Tabs } from "../parts"

// A new promise for each render pass that asks, as a request would be.
function load(text: string, delay: number) {
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(text)
    }, delay)
  })
}

function Late(props: { delay: number }) {
  const text = use(load("late content", props.delay))
  return (
    <Tabs.Root defaultValue="b" id="late-tabs">
      <Tabs.List aria-label={text}>
        <Tabs.Tab value="a">Alpha</Tabs.Tab>
        <Tabs.Tab value="b">Beta</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A</Tabs.Panel>
      <Tabs.Panel value="b">Panel B</Tabs.Panel>
    </Tabs.Root>
  )
}

function Waiting(props: { delay: number }) {
  return <span id="waited">{use(load("waited for", props.delay))}</span>
}

export function Page(props: { delay?: number }) {
  const delay = props.delay ?? 30
  return (
    <main>
      <Probe id="early" defaultOn>Early</Probe>
      <Suspense fallback={<p id="late-fallback">Loading tabs</p>}>
        <Late delay={delay} />
      </Suspense>
      <Suspense fallback={<p id="probe-fallback">Loading probe</p>}>
        <Probe id="around">
          <Waiting delay={delay} />
        </Probe>
      </Suspense>
      <Probe id="after">After</Probe>
    </main>
  )
}
