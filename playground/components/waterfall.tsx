/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Waterfall,
  WaterfallAxis,
  WaterfallBar,
  WaterfallCell,
  WaterfallColumnHeader,
  WaterfallHeaderRow,
  WaterfallIndicator,
  WaterfallRow,
  WaterfallRowHeader,
} from "../../src/components/waterfall"

const trace = [
  {
    value: "page",
    label: "GET /",
    start: 0,
    duration: 400,
    children: [
      { value: "db", label: "Query", start: 20, duration: 120 },
      { value: "render", label: "Render", start: 150, duration: 200 },
    ],
  },
  { value: "font", label: "Font", start: 300, duration: 80 },
]

export function WaterfallPage() {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <main id="page-waterfall">
      <Waterfall id="wf" aria-label="Trace" items={trace} defaultExpanded={["page"]} value={selected} onValueChange={(next) => setSelected(next)}>
        <WaterfallHeaderRow>
          <WaterfallColumnHeader>Name</WaterfallColumnHeader>
          <WaterfallColumnHeader>Status</WaterfallColumnHeader>
          <WaterfallColumnHeader>
            <WaterfallAxis id="wf-axis" />
          </WaterfallColumnHeader>
        </WaterfallHeaderRow>
        <WaterfallRow id="wf-page" value="page">
          <WaterfallRowHeader>
            <WaterfallIndicator id="wf-page-indicator">{">"}</WaterfallIndicator>
            GET /
          </WaterfallRowHeader>
          <WaterfallCell>200</WaterfallCell>
          <WaterfallBar id="wf-page-bar" />
        </WaterfallRow>
        <WaterfallRow id="wf-db" value="db">
          <WaterfallRowHeader>Query</WaterfallRowHeader>
          <WaterfallCell>ok</WaterfallCell>
          <WaterfallBar />
        </WaterfallRow>
        <WaterfallRow id="wf-render" value="render">
          <WaterfallRowHeader>Render</WaterfallRowHeader>
          <WaterfallCell>ok</WaterfallCell>
          <WaterfallBar />
        </WaterfallRow>
        <WaterfallRow id="wf-font" value="font">
          <WaterfallRowHeader>Font</WaterfallRowHeader>
          <WaterfallCell>ok</WaterfallCell>
          <WaterfallBar />
        </WaterfallRow>
      </Waterfall>
      <output id="wf-value">{String(selected)}</output>
      <Waterfall id="auto" aria-label="Whole trace" items={trace} />
    </main>
  )
}
