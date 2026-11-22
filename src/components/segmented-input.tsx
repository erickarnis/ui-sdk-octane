/** @jsxImportSource octane */
// Ported from @ui-sdk/react's segmented-input (Apache-2.0, 0.1.0-beta.13).
// What Date Input and Time Input render alike: the root with its segments and
// hidden input, and a segment, which is an input or the text between inputs.
import type {
  dateInput,
  DateInputSegmentData,
  DateInputSegmentState,
  DateInputState,
} from "@ui-sdk/core/date-input"
import type { OctaneNode } from "octane"
import {
  renderElement,
  usePart,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { controlRender, type useFieldControl } from "./field-context.js"
import { contentOf, defined } from "./octane.js"

type RootProps = Omit<
  PartProps<"div", DateInputState>,
  "defaultValue" | "onChange"
>

type SegmentProps = Omit<
  PartProps<"input", DateInputSegmentState>,
  "value" | "defaultValue" | "children"
> & {
  /** The segment it shows, from the root's `segments`. */
  segment: DateInputSegmentData
  /** The text between segments, which it shows unless it has children. Segments you type in take none. */
  children?: OctaneNode
}

// Time Input's primitive has the same slots and state.
type Segmented = typeof dateInput

// The core writes an input's text as it changes, so Octane only renders where it starts.
function useSegment(
  primitive: Segmented,
  { segment, render, children, ...props }: SegmentProps
) {
  const own = { segment, id: segment.key }
  const input = (merged: Props, state: DateInputSegmentState) => {
    const { value, ...rest } = merged
    return renderElement(
      "input",
      { ...rest, defaultValue: value },
      render,
      state
    )
  }
  if (segment.editable)
    return usePart(
      primitive,
      "segment",
      own,
      { ...props, render: input },
      "input"
    )
  // The text between segments renders as a span with the props an input
  // segment takes, which upstream hands on as a plain object too.
  const text: object = defined({
    ...props,
    render,
    children: children ?? segment.text,
  })
  return usePart(primitive, "segment", own, text, "span")
}

function useSegmentedRoot(
  primitive: Segmented,
  instance: PrimitiveHandle<Segmented>,
  field: ReturnType<typeof useFieldControl>,
  { render, children, ...props }: RootProps,
  Segment: (props: SegmentProps) => OctaneNode
) {
  const content = (state: DateInputState) => {
    // Read now: JSX reads its children only when Octane renders the element.
    const body =
      children === undefined
        ? state.segments.map((segment) => (
            <Segment key={segment.key} segment={segment} />
          ))
        : contentOf(children, state)
    return (
      <>
        {body}
        <HiddenInput primitive={primitive} />
      </>
    )
  }
  return usePart(
    instance,
    "root",
    {},
    defined({
      ...props,
      children: content,
      render: controlRender(field, "div", render),
    })
  )
}

function HiddenInput({ primitive }: { primitive: Segmented }) {
  return usePart(primitive, "hidden-input", {}, {}, "input")
}

export {
  type RootProps,
  type SegmentProps,
  type Segmented,
  useSegment,
  useSegmentedRoot,
}
