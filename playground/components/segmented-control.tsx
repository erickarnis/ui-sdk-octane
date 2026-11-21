/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "../../src/components/segmented-control"
import { SubmitForm } from "./form"

type View = "list" | "grid" | "board"

export function SegmentedControlPage() {
  const [view, setView] = useState<View>("grid")
  return (
    <main id="page-segmented-control">
      <SubmitForm id="sc-form">
        <SegmentedControl id="sc" name="size" defaultValue="m" aria-label="Size" style={{ position: "relative", display: "flex" }}>
          <SegmentedControlIndicator id="sc-indicator" />
          <SegmentedControlItem id="sc-s" value="s">
            S
          </SegmentedControlItem>
          <SegmentedControlItem id="sc-m" value="m">
            M
          </SegmentedControlItem>
          <SegmentedControlItem id="sc-l" value="l" disabled>
            L
          </SegmentedControlItem>
          <SegmentedControlItem id="sc-xl" value="xl">
            XL
          </SegmentedControlItem>
        </SegmentedControl>
      </SubmitForm>
      <SegmentedControl<View> id="csc" aria-label="View" value={view} onValueChange={(next) => next && setView(next)}>
        <SegmentedControlItem id="csc-list" value="list">
          List
        </SegmentedControlItem>
        <SegmentedControlItem id="csc-grid" value="grid">
          Grid
        </SegmentedControlItem>
        <SegmentedControlItem id="csc-board" value="board">
          Board
        </SegmentedControlItem>
      </SegmentedControl>
      <output id="csc-value">{view}</output>
      <button id="csc-outside" type="button" onClick={() => setView("board")}>
        Board
      </button>
      <Field name="align">
        <FieldLabel id="fsc-label">Align</FieldLabel>
        <SegmentedControl id="fsc">
          <SegmentedControlItem value="left">Left</SegmentedControlItem>
          <SegmentedControlItem value="right">Right</SegmentedControlItem>
        </SegmentedControl>
      </Field>
    </main>
  )
}
