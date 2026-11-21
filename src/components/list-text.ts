// Ported from @ui-sdk/react's list-text (Apache-2.0, 0.1.0-beta.13).
import type { MatchSegment } from "@ui-sdk/core/combobox"
import { createElement, type OctaneNode } from "octane"

// An item's text with the parts that matched in `<mark>`, for the list
// components' item text parts.
function markSegments(segments: MatchSegment[]): OctaneNode[] {
  return segments.map(({ text, match }, index) =>
    match ? createElement("mark", { key: index }, text) : text
  )
}

// The text an item text part marks: its own string content, or else its item's label.
function textToMark(children: unknown, label: string | undefined) {
  return typeof children === "string" ? children : (label ?? "")
}

export { markSegments, textToMark }
