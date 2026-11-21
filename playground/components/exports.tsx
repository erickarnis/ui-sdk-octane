/** @jsxImportSource octane */
// One use of each component entry that only re-exports core, to show the
// entry resolves in both builds.
import { createAgent } from "../../src/components/agent"
import { formatColor, parseColor } from "../../src/components/color"
import { rubberBand } from "../../src/components/gesture"
import { createHistory } from "../../src/components/history"
import { cropImage } from "../../src/components/image"
import { formatNumber, stepBy } from "../../src/components/number"
import { observe } from "../../src/components/observe"
import { matchRanges } from "../../src/components/text-match"

const color = parseColor("#ff0000")
const history = createHistory(createAgent())

export function ExportsPage() {
  const results: Record<string, string> = {
    "text-match": JSON.stringify(matchRanges("Separator", "sep", "startsWith")),
    gesture: String(Math.round(rubberBand(10, 100) * 1000) / 1000),
    image: typeof cropImage,
    observe: typeof observe,
    history: String(history.position()),
    agent: typeof createAgent().act,
    color: color ? formatColor(color, "hex") : "none",
    number: formatNumber(stepBy(1.25, { direction: 1, size: "step" }, { min: 0, max: 2, step: 0.25 }), "en-US"),
  }
  return (
    <main id="page-exports">
      {Object.entries(results).map(([name, value]) => (
        <output key={name} id={"x-" + name}>
          {value}
        </output>
      ))}
    </main>
  )
}
