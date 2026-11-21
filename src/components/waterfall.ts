/** @jsxImportSource octane */
// Ported from @ui-sdk/react's waterfall (Apache-2.0, 0.1.0-beta.13).
import {
  waterfall as waterfallPrimitive,
  type WaterfallAxisProps,
  type WaterfallAxisState,
  type WaterfallOptions,
  type WaterfallState,
  type WaterfallTimeState,
} from "@ui-sdk/core/waterfall"
import { createElement, type OctaneNode } from "octane"
import { readIn } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { defined } from "./octane.js"

const parts = createParts(waterfallPrimitive, {
  "header-row": "div",
  "column-header": "div",
  axis: "div",
  tick: "span",
  mark: "span",
  row: "div",
  "row-header": "div",
  indicator: "span",
  cell: "div",
  bar: "div",
})

// Element props that mean something else on a waterfall.
type Clashing = "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Waterfall`.
 */
type WaterfallProps = Omit<
  PartProps<"div", WaterfallState>,
  Clashing | keyof WaterfallOptions
> &
  WaterfallOptions

/**
 * A trace's spans on a shared time axis, as a tree of rows you expand and
 * collapse, with one tab stop. Without children, it renders a row for every span.
 */
function Waterfall({
  items,
  range,
  value,
  defaultValue,
  onValueChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  onHighlight,
  format,
  locale,
  getBarLabel,
  controller,
  debug,
  children,
  ...props
}: WaterfallProps): OctaneNode {
  const waterfall = usePrimitive(
    waterfallPrimitive,
    defined({
      items,
      range,
      value,
      defaultValue,
      onValueChange,
      expanded,
      defaultExpanded,
      onExpandedChange,
      onHighlight,
      format,
      locale,
      getBarLabel,
      controller,
      debug,
    })
  )
  const content =
    children ??
    readIn(waterfall, () => waterfall.api.internal.all()).map((item) =>
      createElement(
        WaterfallRow,
        { key: item.value, value: item.value },
        createElement(
          WaterfallRowHeader,
          null,
          item.children && createElement(WaterfallIndicator),
          item.label
        ),
        createElement(WaterfallBar)
      )
    )
  return usePart(waterfall, "root", {}, { ...props, children: content })
}

/**
 * The row of column headers, above the rows.
 */
const WaterfallHeaderRow = parts.HeaderRow

/**
 * A column's header, like "Name" or "Timeline".
 */
const WaterfallColumnHeader = parts.ColumnHeader

/**
 * The ruler of round times above the bars, hidden from screen readers. Without children, it renders its ticks.
 */
function WaterfallAxis({
  children = ticks,
  ...props
}: PartProps<"div", WaterfallAxisState> & WaterfallAxisProps): OctaneNode {
  return createElement(parts.Axis, defined({ ...props, children }))
}

const ticks = (state: WaterfallAxisState) =>
  state.ticks.map((tick) =>
    createElement(WaterfallTick, { key: tick.time, time: tick.time })
  )

/**
 * One time on the axis, placed by `--waterfall-tick`. Without children, it shows the time.
 */
function WaterfallTick({
  children = label,
  ...props
}: Parameters<typeof parts.Tick>[0]): OctaneNode {
  return createElement(parts.Tick, defined({ ...props, children }))
}

const label = (state: WaterfallTimeState) => state.label

/**
 * A moment across every row, like DOMContentLoaded, placed by `--waterfall-mark`.
 */
const WaterfallMark = parts.Mark

/**
 * One span's row. Its `--waterfall-start` and `--waterfall-size` place the span's bar.
 */
const WaterfallRow = parts.Row

/**
 * The cell that names the span. Put the indicator and the span's label in it.
 */
const WaterfallRowHeader = parts.RowHeader

/**
 * The arrow that expands and collapses a span with children.
 */
const WaterfallIndicator = parts.Indicator

/**
 * A cell of your own, like a status or a size.
 */
const WaterfallCell = parts.Cell

/**
 * The cell on the time axis, which screen readers hear as the span's start and duration.
 */
const WaterfallBar = parts.Bar

export {
  createWaterfallController,
  visibleWaterfallRows,
} from "@ui-sdk/core/waterfall"
export type {
  ListHighlightDetails,
  NumberFormat,
  WaterfallApi,
  WaterfallAxisProps,
  WaterfallAxisState,
  WaterfallBarLabelDetails,
  WaterfallChangeOptions,
  WaterfallController,
  WaterfallData,
  WaterfallDataItem,
  WaterfallDataRow,
  WaterfallExpandedChangeReason,
  WaterfallOptions,
  WaterfallPrimitive,
  WaterfallRowPartProps,
  WaterfallRowProps,
  WaterfallRowState,
  WaterfallState,
  WaterfallTickData,
  WaterfallTimeProps,
  WaterfallTimeState,
  WaterfallValueChangeReason,
} from "@ui-sdk/core/waterfall"

export {
  Waterfall,
  WaterfallAxis,
  WaterfallBar,
  WaterfallCell,
  WaterfallColumnHeader,
  WaterfallHeaderRow,
  WaterfallIndicator,
  WaterfallMark,
  WaterfallRow,
  WaterfallRowHeader,
  WaterfallTick,
  type WaterfallProps,
}
