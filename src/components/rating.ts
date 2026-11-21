/** @jsxImportSource octane */
// Ported from @ui-sdk/react's rating (Apache-2.0, 0.1.0-beta.13).
import {
  rating,
  ratingItemValues,
  type RatingItemState,
  type RatingOptions,
  type RatingState,
} from "@ui-sdk/core/rating"
import {
  createContext,
  createElement,
  Fragment,
  useContext,
  type OctaneNode,
} from "octane"
import { usePart, usePrimitive, type PartProps } from "../primitive.js"
import { controlRender, FieldContext, useJoinField } from "./field-context.js"
import { contentOf, defined } from "./octane.js"

const ItemContext = createContext<{ index: number; step: number } | null>(null)

/**
 * A score picked from a row of stars, a radio per star or half star, with a
 * preview while a pointer moves over them. Its children render once per star.
 */
function Rating({
  value,
  defaultValue,
  onValueChange,
  max = 5,
  step = 1,
  deselectable,
  disabled,
  readOnly,
  required,
  name,
  form,
  loop,
  getValueLabel,
  controller,
  debug,
  render,
  children,
  ...props
}: RatingOptions &
  Omit<
    PartProps<"div", RatingState>,
    "defaultValue" | "onChange" | "onSelect" | "children"
  > & {
    children?: OctaneNode
  }): OctaneNode {
  const field = useJoinField(useContext(FieldContext))
  const control = usePrimitive(
    rating,
    defined({
      value,
      defaultValue,
      onValueChange,
      max,
      step,
      deselectable,
      disabled: disabled || field?.disabled,
      readOnly,
      required,
      name: name ?? field?.name,
      form,
      loop,
      getValueLabel,
      controller,
      debug,
    })
  )
  // A context is its own provider in Octane.
  const stars = Array.from({ length: max }, (_, at) =>
    createElement(
      ItemContext,
      { key: at, value: { index: at + 1, step } },
      children ?? createElement(RatingItem)
    )
  )
  return usePart(
    control,
    "root",
    {},
    defined({
      ...props,
      render: controlRender(field, "div", render),
      children: stars,
    })
  )
}

function RatingRadio({ value }: { value: string }) {
  return createElement(
    Fragment,
    null,
    usePart(rating, "radio", { value }, {}, "button"),
    usePart(rating, "input", { value }, {}, "input")
  )
}

/**
 * One star. Put its icon inside: the state says how full it is, and the
 * radios that pick its score sit over it.
 */
function RatingItem({
  children,
  ...props
}: PartProps<"span", RatingItemState>): OctaneNode {
  const item = useContext(ItemContext)
  if (!item) {
    throw new Error("RatingItem must be used inside <Rating>.")
  }
  const radios = ratingItemValues(item.index, item.step).map((score) =>
    createElement(RatingRadio, { key: score, value: String(score) })
  )
  return usePart(
    rating,
    "item",
    { index: item.index },
    {
      ...props,
      children: (state: RatingItemState) =>
        createElement(Fragment, null, contentOf(children, state), radios),
    },
    "span"
  )
}

export { createRatingController } from "@ui-sdk/core/rating"
export type {
  RatingApi,
  RatingChangeOptions,
  RatingController,
  RatingItemProps,
  RatingItemState,
  RatingOptions,
  RatingPrimitive,
  RatingState,
  RatingValueChangeReason,
} from "@ui-sdk/core/rating"

export { Rating, RatingItem }
