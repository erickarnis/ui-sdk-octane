/** @jsxImportSource octane */
// Ported from @ui-sdk/react's pagination (Apache-2.0, 0.1.0-beta.13).
import {
  pagination,
  type PaginationLinkProps,
  type PaginationLinkState,
  type PaginationStepState,
} from "@ui-sdk/core/pagination"
import type { OctaneNode } from "octane"
import { useHandle } from "../internal.js"
import { createParts, usePart, type PartProps } from "../primitive.js"
import { defined } from "./octane.js"

const parts = createParts(pagination, {
  root: "nav",
  list: "ul",
  item: "li",
  ellipsis: "span",
})

// Parts are links with `getHref`, and buttons without. A change to `getHref`
// changes their attributes, so they render again and read it.
function useTag() {
  return useHandle(pagination).state.getHref
    ? ("a" as const)
    : ("button" as const)
}

/**
 * A navigation landmark around the page links. Name it with `aria-label`.
 */
const Pagination = parts.Root

/**
 * The list of pages and steps. Its children can be a function of the state,
 * whose `items` are the pages to show.
 */
const PaginationList = parts.List

/**
 * One entry in the list, around a link, a step or an ellipsis.
 */
const PaginationItem = parts.Item

/**
 * A page. The current one has `aria-current="page"`. Shows its number unless it has children.
 */
function PaginationLink({
  page,
  children = page,
  ...props
}: PartProps<"a", PaginationLinkState> & PaginationLinkProps): OctaneNode {
  // Links are told apart by their page.
  return usePart(
    pagination,
    "link",
    { page, id: String(page) },
    { ...props, children },
    useTag()
  )
}

type StepProps = PartProps<"a", PaginationStepState>

function useStep(
  name: "previous" | "next" | "first" | "last",
  props: StepProps
) {
  return usePart(pagination, name, {}, props, useTag())
}

/**
 * Goes to the previous page. `aria-disabled` on the first page, where it stays focusable.
 */
function PaginationPrevious(props: StepProps): OctaneNode {
  return useStep("previous", props)
}

/**
 * Goes to the next page. `aria-disabled` on the last page, where it stays focusable.
 */
function PaginationNext(props: StepProps): OctaneNode {
  return useStep("next", props)
}

/**
 * Goes to the first page. `aria-disabled` there.
 */
function PaginationFirst(props: StepProps): OctaneNode {
  return useStep("first", props)
}

/**
 * Goes to the last page. `aria-disabled` there.
 */
function PaginationLast(props: StepProps): OctaneNode {
  return useStep("last", props)
}

/**
 * A gap in the range. Hidden from screen readers, since the links around it
 * say which pages there are. Shows "…" unless it has children.
 */
function PaginationEllipsis({
  children = "…",
  ...props
}: PartProps<"span">): OctaneNode {
  return <parts.Ellipsis {...defined({ ...props, children })} />
}

export {
  createPaginationController,
  paginationRange,
} from "@ui-sdk/core/pagination"
export type {
  PaginationChangeOptions,
  PaginationController,
  PaginationLinkProps,
  PaginationLinkState,
  PaginationOptions,
  PaginationPageChangeReason,
  PaginationPrimitive,
  PaginationRangeItem,
  PaginationRangeOptions,
  PaginationState,
  PaginationStepState,
} from "@ui-sdk/core/pagination"

export {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
}
