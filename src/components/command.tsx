/** @jsxImportSource octane */
// Ported from @ui-sdk/react's command (Apache-2.0, 0.1.0-beta.13). `Command`
// reads its children for a `CommandList`, so it is marked
// `descriptorChildren`: Octane then hands it the children written in a
// template as elements, not as a compiled block. The rest take theirs as a
// block, which they only render.
import {
  command as commandPrimitive,
  type CommandData,
  type CommandEmptyState,
  type CommandItemProps,
  type CommandItemState,
  type CommandItemTextState,
  type CommandListState,
  type CommandOptions,
  type CommandPageProps,
  type CommandShortcutProps,
  type CommandShortcutState,
  type CommandState,
} from "@ui-sdk/core/command"
import {
  createContext,
  descriptorChildren,
  useContext,
  useId,
  type OctaneNode,
} from "octane"
import { useAround, useHandle } from "../internal.js"
import {
  createParts,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import {
  hasChild,
  Placed,
  usePlaceContent,
  usePlacedContent,
} from "./children.js"
import { useControllerEntry } from "./controller-target.js"
import { markSegments, textToMark } from "./list-text.js"
import { contentOf, defined, isContentFunction } from "./octane.js"

const parts = createParts(commandPrimitive, {
  input: "input",
  "item-icon": "span",
  group: "div",
  "group-label": "div",
  separator: "div",
  status: "div",
})

// The page parts sit on: `null` for the first page, undefined outside any page.
const PageContext = createContext<string | null | undefined>(undefined)
// Set while rendering data commands, whose shortcuts the root binds.
const DataContext = createContext(false)

function useCommand() {
  return useHandle(commandPrimitive)
}

type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Command`.
 */
type CommandProps = CommandOptions &
  Omit<PartProps<"div", CommandState, OctaneNode>, Clashing>

/**
 * A search field over an always-open list of commands. Renders a `div` around them.
 */
const Command = descriptorChildren(
  function Command({
    value,
    defaultValue,
    onValueChange,
    query,
    defaultQuery,
    onQueryChange,
    pages,
    defaultPages,
    onPagesChange,
    onAction,
    pendingAnnouncement,
    items,
    emptyItems,
    filter,
    autoHighlight,
    loop,
    status,
    onLoadMore,
    announcement,
    controller,
    debug,
    children,
    ...props
  }: CommandProps): OctaneNode {
    const command = usePrimitive(
      commandPrimitive,
      defined({
        value,
        defaultValue,
        onValueChange,
        query,
        defaultQuery,
        onQueryChange,
        pages,
        defaultPages,
        onPagesChange,
        onAction,
        pendingAnnouncement,
        items,
        emptyItems,
        filter,
        autoHighlight,
        loop,
        status,
        onLoadMore,
        announcement,
        controller,
        debug,
      })
    )
    useControllerEntry(controller, command)
    // A data command renders its list, unless the app placed a CommandList: in
    // the markup, or inside a component of its own.
    const stateful = isContentFunction(children)
    const found = !stateful && hasChild(children, CommandList)
    const [placed, place] = usePlacedContent(!stateful && !!items && !found)
    const own = placed || found
    const content = (state: CommandState) => {
      if (isContentFunction(children)) {
        // Read now: JSX reads a property only when Octane renders the element.
        const shown = children(state)
        return <Placed value={place}>{shown}</Placed>
      }
      return (
        <>
          <Placed value={place}>{children}</Placed>
          <Placed value={null}>{items && !own ? <CommandList /> : null}</Placed>
        </>
      )
    }
    return usePart(command, "root", {}, { ...props, children: content })
  }
)

/**
 * The search field. It keeps focus while arrow keys move the highlight. Name it with `aria-label`.
 */
const CommandInput = parts.Input

/**
 * The listbox. Without children, it renders the command's `items`, ranked as the user types.
 */
function CommandList({
  children,
  ...props
}: PartProps<"div", CommandListState, OctaneNode>): OctaneNode {
  usePlaceContent()
  const command = useCommand()
  const content = (state: CommandListState) => {
    if (children !== undefined) return contentOf(children, state)
    // Read now: JSX reads a property only when Octane renders the element.
    const { items } = state
    return command.state.items ? <CommandItems items={items} /> : null
  }
  return usePart(command, "list", {}, { ...props, children: content })
}

/**
 * A command. Pressing it, or Enter while it's highlighted, runs it, with its `value` passed to the command's
 * `onAction`.
 */
function CommandItem({
  value,
  label,
  keywords,
  disabled,
  shortcut,
  page,
  index,
  onSelect,
  render,
  ...props
}: Omit<PartProps<"div", CommandItemState, OctaneNode>, Clashing> &
  CommandItemProps): OctaneNode {
  const command = useCommand()
  const generated = useId()
  const group = useAround(commandPrimitive, "group")?.id
  const inPage = useContext(PageContext)
  const data = useContext(DataContext)
  const key = value ?? generated
  const item = defined({
    id: key,
    value: key,
    label,
    keywords,
    disabled,
    shortcut,
    page,
    index,
    onSelect,
    group: typeof group === "string" ? group : undefined,
    inPage,
    data,
  })
  // The parts inside read its key, label and shortcut.
  return usePart(command, "item", item, { ...props, render })
}

/**
 * The command's text, with the part the search matched in `<mark>`. Without string content, it shows the command's label.
 */
function CommandItemText({
  children,
  ...props
}: PartProps<"span", CommandItemTextState, OctaneNode>): OctaneNode {
  const item = useAround(commandPrimitive, "item")
  if (!item)
    throw new Error("<CommandItemText> must be used inside <CommandItem>.")
  const id = String(item.value)
  const label = typeof item.label === "string" ? item.label : id
  const part = { id, text: textToMark(children, label) }
  const content = isContentFunction(children)
    ? children
    : (state: CommandItemTextState) => markSegments(state.segments)
  return usePart(
    commandPrimitive,
    "item-text",
    part,
    { ...props, children: content },
    "span"
  )
}

/**
 * An icon inside a command. Screen readers, typeahead and filtering skip it, and `mirror` flips it
 * in right-to-left text.
 */
const CommandItemIcon = parts.ItemIcon

const text = (state: CommandShortcutState) => state.text

/**
 * The keys of a command's shortcut, formatted for the platform. Inside a command, its `shortcut`.
 */
function CommandShortcut({
  shortcut,
  children = text,
  ...props
}: PartProps<"span", CommandShortcutState, OctaneNode> &
  CommandShortcutProps): OctaneNode {
  const inherited = useAround(commandPrimitive, "item")?.shortcut
  return usePart(
    commandPrimitive,
    "shortcut",
    defined({
      shortcut:
        shortcut ?? (typeof inherited === "string" ? inherited : undefined),
    }),
    { ...props, children },
    "span"
  )
}

/**
 * Commands shown while this page is on top. Without `value`, it's the first page. Renders no element.
 */
function CommandPage({
  value,
  children,
}: CommandPageProps & { children?: OctaneNode }): OctaneNode {
  // Its presence, without an element.
  const page = () => <PageContext value={value ?? null}>{children}</PageContext>
  return usePart(commandPrimitive, "page", defined({ value }), { render: page })
}

/**
 * A group of commands. It hides while none of its commands matches the search.
 */
const CommandGroup = parts.Group

/**
 * A group's heading, which names it.
 */
const CommandGroupLabel = parts.GroupLabel

/**
 * A line between groups. Composed separators hide while the list is filtered.
 */
const CommandSeparator = parts.Separator

/**
 * Shown while no command matches. Its message is announced when it appears. Place it outside the list.
 */
function CommandEmpty({
  children,
  ...props
}: PartProps<"div", CommandEmptyState, OctaneNode>): OctaneNode {
  const content = (state: CommandEmptyState) =>
    isContentFunction(children)
      ? children(state)
      : state.empty
        ? children
        : null
  return usePart(commandPrimitive, "empty", {}, { ...props, children: content })
}

/**
 * A polite live region for loading and result counts. Its content is yours, usually a function of its state.
 */
const CommandStatus = parts.Status

/**
 * Renders data commands. Used by data command lists, and available for custom layouts.
 */
function CommandItems({ items }: { items: CommandData }): OctaneNode {
  return (
    <DataContext value={true}>
      {items.map((entry, index) => {
        if (typeof entry === "string") {
          return (
            <CommandItem key={entry} value={entry}>
              {entry}
            </CommandItem>
          )
        }
        if ("type" in entry && entry.type === "separator")
          return <CommandSeparator key={`separator-${index}`} />
        if ("type" in entry && entry.type === "group") {
          return (
            <CommandGroup key={`group-${entry.label ?? index}`}>
              {entry.label ? <CommandGroupLabel>{entry.label}</CommandGroupLabel> : null}
              <CommandItems items={entry.items} />
            </CommandGroup>
          )
        }
        return (
          <CommandItem
            key={entry.value}
            {...defined({
              value: entry.value,
              label: entry.label,
              keywords: entry.keywords,
              disabled: entry.disabled,
              shortcut: entry.shortcut,
            })}
          >
            {entry.label}
          </CommandItem>
        )
      })}
    </DataContext>
  )
}

export { createCommandController } from "@ui-sdk/core/command"
export type {
  CommandActionDetails,
  CommandApi,
  CommandChangeOptions,
  CommandController,
  CommandData,
  CommandDataGroup,
  CommandDataItem,
  CommandEmptyState,
  CommandInputState,
  CommandItemIconProps,
  CommandItemIconState,
  CommandItemProps,
  CommandItemState,
  CommandItemTextState,
  CommandListState,
  CommandOptions,
  CommandPageProps,
  CommandPagesChangeReason,
  CommandPrimitive,
  CommandQueryChangeReason,
  CommandState,
  CommandShortcutProps,
  CommandShortcutState,
  CommandStatusState,
  CommandValueChangeDetails,
  CommandValueChangeReason,
  ListAnnouncement,
  ListFilter,
  ListSeparator,
  MatchSegment,
  SearchFilter,
} from "@ui-sdk/core/command"

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemIcon,
  CommandItems,
  CommandItemText,
  CommandList,
  CommandPage,
  type CommandProps,
  CommandSeparator,
  CommandShortcut,
  CommandStatus,
}
