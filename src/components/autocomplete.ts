/** @jsxImportSource octane */
// Ported from @ui-sdk/react's autocomplete (Apache-2.0, 0.1.0-beta.13).
// `Autocomplete` reads its children for an `AutocompleteContent`, so it is
// marked `descriptorChildren`: Octane then hands it the children written in a
// template as elements, not as a compiled block.
import {
  autocomplete as autocompletePrimitive,
  type AutocompleteContentProps,
  type AutocompleteContentState,
  type AutocompleteEmptyState,
  type AutocompleteInputState,
  type AutocompleteItemTextState,
  type AutocompleteOptions,
  type ListData,
} from "@ui-sdk/core/autocomplete"
import {
  createContext,
  createElement,
  descriptorChildren,
  Fragment,
  useContext,
  useMemo,
  useState,
  type OctaneNode,
} from "octane"
import { HandleScope, useAround, useHandle } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import {
  hasChild,
  settleChildren,
  Placed,
  usePlaceContent,
  usePlacedContent,
} from "./children.js"
import { controlRender, useFieldControl } from "./field-context.js"
import { ListItems, type ListParts } from "./list-items.js"
import { markSegments, textToMark } from "./list-text.js"
import { contentOf, defined, isContentFunction } from "./octane.js"
import {
  inSheetHeader,
  renderPopup,
  sheetHeader,
  SheetHeaderContext,
  sheetViewport,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
} from "./popup.js"

const parts = createParts(autocompletePrimitive, {
  label: "label",
  trigger: "button",
  clear: "button",
  item: "div",
  "item-icon": "span",
  group: "div",
  "group-label": "div",
  separator: "div",
  status: "div",
  arrow: "div",
})

const ContainerContext = createContext<PopupContainer>(undefined)

function useAutocomplete() {
  return useHandle(autocompletePrimitive)
}

/**
 * The props of `Autocomplete`.
 */
type AutocompleteProps = AutocompleteOptions & {
  children?: OctaneNode
}

/**
 * A text field that suggests as you type. The text is the value. Renders no element of its own.
 */
// Typed as the plain component: the marker's own type has no name on Octane 0.16,
// where a declaration that mentioned it would not resolve.
const Autocomplete: (props: AutocompleteProps) => OctaneNode =
  descriptorChildren(function Autocomplete({
    children,
    container,
    ...options
  }: AutocompleteProps): OctaneNode {
    const field = useFieldControl()
    const autocomplete = usePrimitive(
      autocompletePrimitive,
      defined({
        ...options,
        name: options.name ?? field?.name,
        disabled: options.disabled || field?.disabled,
      })
    )
    useControllerEntry(options.controller, autocomplete)
    const [headerElement, setHeader] = useState<HTMLElement | null>(null)
    const header = useMemo(
      () => [headerElement, setHeader] as const,
      [headerElement, setHeader]
    )
    // Before any popup reads them: see settleChildren.
    settleChildren(children)
    // A data autocomplete renders its list, unless the app placed an
    // AutocompleteContent: in the markup, or inside a component of its own.
    const found = hasChild(children, AutocompleteContent)
    const [placed, place] = usePlacedContent(!!options.items && !found)
    const own = placed || found
    return createElement(
      HandleScope,
      { handle: autocomplete },
      createElement(
        ContainerContext,
        { value: container },
        createElement(
          SheetHeaderContext,
          { value: header },
          createElement(Placed, { value: place }, children),
          createElement(
            Placed,
            { value: null },
            options.items && !own
              ? createElement(AutocompleteContent, {})
              : null
          )
        )
      )
    )
  })

/**
 * A visible label for the field.
 */
const AutocompleteLabel = parts.Label

/**
 * The text field. It's the form control, so the text submits under the autocomplete's `name`.
 */
function AutocompleteInput({
  render,
  ...props
}: Omit<
  PartProps<"input", AutocompleteInputState>,
  "value" | "defaultValue" | "children" | "readOnly"
>): OctaneNode {
  const [header] = useContext(SheetHeaderContext)
  const element = {
    ...props,
    render: controlRender(useFieldControl(props), "input", render),
  }
  // While the popup presents as a sheet, the input renders in its header.
  const input = usePart(autocompletePrimitive, "input", {}, element, "input")
  return input && inSheetHeader(input, header)
}

/**
 * A button that opens and closes the suggestions, out of the tab order.
 */
const AutocompleteTrigger = parts.Trigger

/**
 * A button that empties the field. Shown while there's text to clear. Name it with `aria-label`.
 */
const AutocompleteClear = parts.Clear

/**
 * The popup that holds the suggestions, positioned against the field.
 */
function AutocompleteContent({
  side,
  align,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  keepMounted,
  container,
  render,
  children,
  ...props
}: PartProps<"div", AutocompleteContentState, OctaneNode> &
  AutocompleteContentProps): OctaneNode {
  usePlaceContent()
  const autocomplete = useAutocomplete()
  const target = usePopupContainer(useOwnContainer(container, ContainerContext))
  const content = defined({
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    arrowPadding,
    anchor,
    keepMounted,
  })
  const [, setHeader] = useContext(SheetHeaderContext)
  // Reading the part's state subscribes, so items that arrive after the
  // autocomplete rendered still render the list. `autocomplete.state` doesn't subscribe.
  const body = (state: AutocompleteContentState) =>
    createElement(
      Fragment,
      null,
      sheetHeader(autocomplete, setHeader),
      children !== undefined
        ? contentOf(children, state)
        : state.items &&
            autocomplete.state.items &&
            createElement(AutocompleteList, {})
    )
  const element = usePart(autocomplete, "content", content, {
    ...props,
    children: body,
    render: sheetViewport(autocomplete, render),
  })
  return element && renderPopup(element, target)
}

/**
 * The listbox. Without children, it renders the autocomplete's `items`, filtered.
 */
function AutocompleteList({
  children = listItems,
  ...props
}: PartProps<"div", AutocompleteContentState, OctaneNode>): OctaneNode {
  return usePart(autocompletePrimitive, "list", {}, { ...props, children })
}

// From the part's state, so new items re-render the list. Without items it's empty.
const listItems = (state: AutocompleteContentState) =>
  createElement(AutocompleteItems, { items: state.items })

/**
 * A suggestion. Choosing it fills the field in with its text.
 */
const AutocompleteItem = parts.Item

/**
 * The suggestion's text, with the part the field's text matched in `<mark>`. Without string content, it shows the suggestion's label.
 */
function AutocompleteItemText({
  children,
  ...props
}: PartProps<"span", AutocompleteItemTextState, OctaneNode>): OctaneNode {
  const item = useAround(autocompletePrimitive, "item")
  if (!item)
    throw new Error(
      "<AutocompleteItemText> must be used inside <AutocompleteItem>."
    )
  const id = String(item.value)
  const label = typeof item.label === "string" ? item.label : id
  const part = { id, text: textToMark(children, label) }
  const content = isContentFunction(children)
    ? children
    : (state: AutocompleteItemTextState) => markSegments(state.segments)
  return usePart(
    autocompletePrimitive,
    "item-text",
    part,
    { ...props, children: content },
    "span"
  )
}

/**
 * An icon inside a suggestion. Screen readers, typeahead and filtering skip it, and `mirror` flips
 * it in right-to-left text.
 */
const AutocompleteItemIcon = parts.ItemIcon

/**
 * A group of items, named by its `AutocompleteGroupLabel`, and hidden while none of its items shows.
 */
const AutocompleteGroup = parts.Group

/**
 * The group's heading, which names the group.
 */
const AutocompleteGroupLabel = parts.GroupLabel

/**
 * A line between items or groups, hidden from screen readers.
 */
const AutocompleteSeparator = parts.Separator

/**
 * Shown while no suggestion matches. Its message is announced when it appears.
 */
function AutocompleteEmpty({
  children,
  ...props
}: PartProps<"div", AutocompleteEmptyState, OctaneNode>): OctaneNode {
  const content = (state: AutocompleteEmptyState) =>
    isContentFunction(children)
      ? children(state)
      : state.empty
        ? children
        : null
  return usePart(
    autocompletePrimitive,
    "empty",
    {},
    { ...props, children: content }
  )
}

/**
 * A polite live region for loading and result counts. Its content is yours, usually a function of its state.
 */
const AutocompleteStatus = parts.Status

/**
 * An arrow on the popup's edge that points at the field.
 */
const AutocompleteArrow = parts.Arrow

/**
 * Renders data suggestions. Used by data autocompletes, and available for custom layouts.
 */
function AutocompleteItems({ items }: { items: ListData<string> }): OctaneNode {
  // Called, not rendered, so the items keep their string type: it uses no hooks.
  return ListItems({ items, parts: listParts, keyOf: String })
}

const listParts: ListParts<string> = {
  Item: AutocompleteItem,
  Group: AutocompleteGroup,
  GroupLabel: AutocompleteGroupLabel,
  Separator: AutocompleteSeparator,
}

export { createAutocompleteController } from "@ui-sdk/core/autocomplete"
export type {
  AutocompleteApi,
  AutocompleteArrowState,
  AutocompleteChangeOptions,
  AutocompleteClearProps,
  AutocompleteClearState,
  AutocompleteContentProps,
  AutocompleteContentState,
  AutocompleteController,
  AutocompleteDismissReason,
  AutocompleteEmptyState,
  AutocompleteInputState,
  AutocompleteItemIconProps,
  AutocompleteItemIconState,
  AutocompleteItemProps,
  AutocompleteItemState,
  AutocompleteItemTextState,
  AutocompleteOpenChangeReason,
  AutocompleteOptions,
  AutocompletePrimitive,
  AutocompleteStatusState,
  AutocompleteSubmitDetails,
  AutocompleteTriggerState,
  AutocompleteValueChangeDetails,
  AutocompleteValueChangeReason,
  ListAnnouncement,
  ListData,
  ListFilter,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  MatchSegment,
  SearchFilter,
} from "@ui-sdk/core/autocomplete"

export {
  Autocomplete,
  AutocompleteArrow,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteItemIcon,
  AutocompleteItems,
  AutocompleteItemText,
  AutocompleteLabel,
  AutocompleteList,
  type AutocompleteProps,
  AutocompleteSeparator,
  AutocompleteStatus,
  AutocompleteTrigger,
}
