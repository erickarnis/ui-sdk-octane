// Type tests for `createParts`: options, slot props, each tag's element
// props, the names of the parts, a root with and without a tag, and slot
// names the primitive doesn't have.
//
// Compiled by `pnpm typecheck`, never run. A line under `@ts-expect-error`
// fails the check when it stops being an error, and every other line fails it
// when it becomes one.
import type { ComponentProps, OctaneNode } from "octane"
import {
  createParts,
  type PartComponent,
  type Parts,
} from "../../src/primitive"
import { list } from "./primitives"

const List = createParts(list, {
  root: "ul",
  item: "li",
  handle: "button",
  "drag-preview": "div",
})
declare const content: OctaneNode

// Options go on the root, typed from the primitive.
;<List.Root
  order={["a", "b"]}
  dense
  onOrderChange={(order) => {
    const known: string[] = order
    // @ts-expect-error The order is a list of strings.
    const wrong: number[] = order
    void known
    void wrong
  }}
>
  <List.Item value="a">A</List.Item>
</List.Root>
// @ts-expect-error `order` is a list.
;<List.Root order="a" />
// @ts-expect-error `dense` is a boolean.
;<List.Root dense="yes" />
// @ts-expect-error Neither the list nor a `ul` has `sorted`.
;<List.Root sorted />
// @ts-expect-error A root takes no options but the primitive's, and no slot's props.
;<List.Root value="a" />

// Slot props go on the slot's part.
;<List.Item value="a" disabled />
;<List.Handle item="a" />
// @ts-expect-error An item needs a value.
;<List.Item />
// @ts-expect-error An item's value is a string.
;<List.Item value={1} />
// @ts-expect-error `disabled` is a boolean.
;<List.Item value="a" disabled="yes" />
// @ts-expect-error The preview takes no value.
;<List.DragPreview value="a" />
// @ts-expect-error Options stay on the root.
;<List.Item value="a" dense />

// The tag types the element's props, and its handlers' `currentTarget`.
;<List.Root onClick={(event) => event.currentTarget.compact} />
;<List.Item value="a" onClick={(event) => event.currentTarget.value} />
;<List.Handle item="a" type="submit" disabled formAction="/save" />
;<List.DragPreview aria-hidden="true" data-preview="" hidden />
// @ts-expect-error A `div` has no `href`.
;<List.DragPreview href="#" />
// @ts-expect-error A button's `type` is one of three.
;<List.Handle item="a" type="link" />
// @ts-expect-error A list item has no `formAction`.
;<List.Item value="a" formAction="/save" />
// A slot's prop wins over the element's of the same name: an `li` has a
// numeric `value`, and the item's is its key.
const itemProps: ComponentProps<typeof List.Item> = { value: "a" }
// @ts-expect-error The slot's `value`, not the `li`'s.
const liProps: ComponentProps<typeof List.Item> = { value: 1 }
void itemProps
void liProps

// A part is named for its slot, in Pascal case, and only tagged slots have one.
const named: PartComponent<typeof list, "drag-preview", "div"> =
  List.DragPreview
void named
const OnlyItems = createParts(list, { item: "li" })
;<OnlyItems.Item value="a" />
// @ts-expect-error `handle` got no tag, so there is no `Handle`.
OnlyItems.Handle
// @ts-expect-error A slot the primitive doesn't have has no part.
List.Row

// Without a `root` tag, the root takes the options and content, and renders
// no element to take props.
;<OnlyItems.Root order={["a"]} dense>
  {content}
</OnlyItems.Root>
// @ts-expect-error `order` is still a list.
;<OnlyItems.Root order="a" />
// @ts-expect-error No element, so no class names.
;<OnlyItems.Root className="list" />
// @ts-expect-error No element, so nothing to render as another.
;<OnlyItems.Root render={<ol />} />
// @ts-expect-error No element, so no handlers.
;<OnlyItems.Root onClick={() => {}} />

// `Parts` names what `createParts` returns.
const typed: Parts<typeof list, { root: "ul"; item: "li" }> = createParts(
  list,
  { root: "ul", item: "li" }
)
;<typed.Root order={[]} className="list" />
// @ts-expect-error A `Parts` without `handle` has no `Handle`.
typed.Handle

// Tags are for the primitive's slots, and are tag names.
// @ts-expect-error `row` isn't a slot of the list.
createParts(list, { root: "ul", row: "li" })
// @ts-expect-error `rot` isn't either.
createParts(list, { rot: "ul" })
// @ts-expect-error `list-item` isn't a tag.
createParts(list, { root: "ul", item: "list-item" })
// @ts-expect-error A tag is a name, not a component.
createParts(list, { root: () => null })
