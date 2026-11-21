/** @jsxImportSource octane */
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaScrollToEnd,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "../../src/components/scroll-area"

const lines = Array.from({ length: 40 }, (_, at) => "Line " + (at + 1))

export function ScrollAreaPage() {
  return (
    <main id="page-scroll-area">
      <ScrollArea id="sa" style={{ position: "relative", width: "200px", height: "120px" }}>
        <ScrollAreaViewport id="sa-viewport" style={{ width: "100%", height: "100%" }} tabIndex={0}>
          <ScrollAreaContent id="sa-content">
            {lines.map((line) => (
              <p key={line} style={{ margin: 0, whiteSpace: "nowrap" }}>
                {line} {line === "Line 3" ? "with a long tail that runs well past the width of the viewport" : ""}
              </p>
            ))}
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar id="sa-y" style={{ width: "10px" }}>
          <ScrollAreaThumb id="sa-y-thumb" style={{ width: "10px", background: "#888" }} />
        </ScrollAreaScrollbar>
        <ScrollAreaScrollbar id="sa-x" orientation="horizontal" style={{ height: "10px" }}>
          <ScrollAreaThumb id="sa-x-thumb" style={{ height: "10px", background: "#888" }} />
        </ScrollAreaScrollbar>
        <ScrollAreaCorner id="sa-corner" />
        <ScrollAreaScrollToEnd id="sa-end" style={{ position: "absolute", bottom: "12px", right: "12px" }}>
          Jump to end
        </ScrollAreaScrollToEnd>
      </ScrollArea>
    </main>
  )
}
