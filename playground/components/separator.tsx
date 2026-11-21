/** @jsxImportSource octane */
import { Separator } from "../../src/components/separator"

export function SeparatorPage() {
  return (
    <main id="page-separator">
      <p>Above</p>
      <Separator id="sep" />
      <div style={{ display: "flex" }}>
        <span>Left</span>
        <Separator id="vsep" orientation="vertical" />
        <span>Right</span>
      </div>
      <Separator id="dsep" decorative />
      <Separator id="rsep" render={<hr />} />
    </main>
  )
}
