/** @jsxImportSource octane */
import { useState } from "octane"
import { Resizable, ResizableHandle, ResizablePanel } from "../../src/components/resizable"

export function ResizablePage() {
  const [layout, setLayout] = useState("")
  return (
    <main id="page-resizable">
      <Resizable id="rz" style={{ display: "flex", width: "400px", height: "100px" }} onLayoutChange={(sizes) => setLayout(sizes.map((size) => Math.round(size)).join(","))}>
        <ResizablePanel id="rz-a" defaultSize={30} minSize={10} style={{ background: "#eee" }}>
          A
        </ResizablePanel>
        <ResizableHandle id="rz-handle" aria-label="Resize" style={{ width: "6px", background: "#333" }} />
        <ResizablePanel id="rz-b" style={{ background: "#ddd" }}>
          B
        </ResizablePanel>
      </Resizable>
      <output id="rz-layout">{layout}</output>
    </main>
  )
}
