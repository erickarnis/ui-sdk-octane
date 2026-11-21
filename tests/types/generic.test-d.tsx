// Type tests for primitives with type parameters: one defined here, and
// core's own `select`, `combobox` and `tabs` through `createParts`. The
// cases for core's follow @ui-sdk/react's own type tests.
//
// Compiled by `pnpm typecheck`, never run.
import { useState, type OctaneNode } from "octane"
import { combobox } from "@ui-sdk/core/combobox"
import { select } from "@ui-sdk/core/select"
import { tabs } from "@ui-sdk/core/tabs"
import {
  createParts,
  type GenericPartComponent,
  type PartComponent,
} from "../../src/primitive"
import { picker, type Choice } from "./primitives"

type Fruit = { name: string }
declare const apple: Fruit
declare const content: OctaneNode

const Picker = createParts(picker, {
  root: "div",
  item: "button",
  label: "span",
})

// `T` comes from `value`, and reaches `onValueChange` and the root's state.
;<Picker.Root
  value={apple}
  onValueChange={(value) => {
    const known: Fruit | null = value
    // @ts-expect-error `value` is a fruit or null, not text.
    const wrong: string = value
    void known
    void wrong
  }}
  className={(state) => (state.value?.name === "apple" ? "on" : "off")}
  render={(props, state) => <div {...props} title={state.value?.name} />}
>
  {(state) => state.value?.name}
</Picker.Root>
// @ts-expect-error The root's state holds a fruit, which has no `colour`.
;<Picker.Root value={apple} className={(state) => state.value?.colour} />
// It comes from any option that names it.
const choices: Choice<number>[] = [{ value: 1, label: "One" }]
;<Picker.Root choices={choices} onValueChange={(value) => value?.toFixed()} />
;<Picker.Root defaultValue={1} onValueChange={(value) => value?.toFixed()} />
// The second parameter comes from `meta`.
;<Picker.Root
  value={apple}
  meta={new Date()}
  onValueChange={(value, meta) => [value?.name, meta?.getTime()]}
/>
// Without anything to infer them from, they are the generic's defaults.
;<Picker.Root onValueChange={(value) => value?.toUpperCase()} />
// @ts-expect-error A string by default, with no `name`.
;<Picker.Root onValueChange={(value) => value?.name} />
// Written out, they type the options.
;<Picker.Root<Fruit> onValueChange={(value) => value?.name} />
;<Picker.Root<Fruit, number> onValueChange={(value, meta) => [value?.name, meta?.toFixed()]} />
;<Picker.Root<Fruit> value={apple}>
  {(state) => state.value?.name}
</Picker.Root>
// @ts-expect-error A fruit, not text.
;<Picker.Root<Fruit> value="apple" />
// @ts-expect-error `value` and `defaultValue` share the parameter.
;<Picker.Root<Fruit> value={apple} defaultValue="apple" />
// Content still passes as it is, and element props still follow the tag.
;<Picker.Root value={apple} aria-label="Fruit">
  {content}
</Picker.Root>
// @ts-expect-error A `div` has no `href`.
;<Picker.Root value={apple} href="#" />

// A part whose props the parameter reaches is generic too: an item's `value`.
;<Picker.Item value={apple} className={(state) => (state.selected ? "on" : "off")}>
  {(state) => String(state.selected)}
</Picker.Item>
;<Picker.Item<Fruit> value={apple} type="button">
  {(state) => String(state.selected)}
</Picker.Item>
// @ts-expect-error A fruit, not text.
;<Picker.Item<Fruit> value="apple" />
// @ts-expect-error An item needs a value.
;<Picker.Item />
// @ts-expect-error An item's state has no `value`.
;<Picker.Item value={apple} className={(state) => state.value} />
const item: GenericPartComponent<typeof picker, "item", "button"> = Picker.Item
void item
// A part it doesn't reach is typed as any other.
;<Picker.Label className={(state) => (state.filled ? "filled" : "")} />
// @ts-expect-error A label takes no value.
;<Picker.Label value={apple} />
const label: PartComponent<typeof picker, "label", "span"> = Picker.Label
void label
// Without a tag, the root is generic all the same.
const BarePicker = createParts(picker, { item: "button" })
;<BarePicker.Root value={apple} onValueChange={(value) => value?.name}>
  {content}
</BarePicker.Root>
// @ts-expect-error A fruit or null, with no `toFixed`.
;<BarePicker.Root value={apple} onValueChange={(value) => value?.toFixed()} />

// Core's select.
const Select = createParts(select, { root: "div", item: "div" })
// One value: `T` comes from `value`, and `onValueChange` gets `T` or null.
;<Select.Root
  value={apple}
  onValueChange={(value) => {
    const known: Fruit | null = value
    // @ts-expect-error `value` is a fruit or null, not a list.
    const wrong: Fruit[] = value
    void known
    void wrong
  }}
/>
// `multiple` makes the value a list.
;<Select.Root
  multiple
  defaultValue={[1, 2]}
  onValueChange={(value) => {
    const known: number[] = value
    // @ts-expect-error `value` is a list.
    const wrong: number | null = value
    void known
    void wrong
  }}
/>
// `T` comes from `items` too.
;<Select.Root
  items={[{ value: 1, label: "One" }]}
  onValueChange={(value) => {
    const known: number | null = value
    void known
  }}
/>
// Without a value, it's a string.
;<Select.Root onValueChange={(value) => value?.toUpperCase()} />
;<Select.Root multiple onValueChange={(value) => value.map((item) => item.toUpperCase())} />
// Written out.
;<Select.Root<Fruit> onValueChange={(value) => value?.name} />
// @ts-expect-error With `multiple`, the value is a list.
;<Select.Root multiple value={apple} />
// An item's `value` is any type, and the root's `T` doesn't reach it.
;<Select.Item value={apple} className={(state) => (state.selected ? "on" : "off")}>
  {(state) => (state.highlighted ? "›" : "")}
</Select.Item>
;<Select.Item<Fruit> value={apple} />
// @ts-expect-error A fruit, not text.
;<Select.Item<Fruit> value="apple" />
// @ts-expect-error An item needs a value.
;<Select.Item />
// A state's setter is a callback for either shape.
function Controlled() {
  const [values, setValues] = useState<string[]>([])
  const [value, setValue] = useState<string | null>(null)
  return (
    <>
      <Select.Root multiple value={values} onValueChange={setValues} />
      <Select.Root value={value} onValueChange={setValue} />
    </>
  )
}
void Controlled
// An inline list of objects with `multiple` still makes `T` the object.
;<Select.Root
  multiple
  value={[{ id: 1 }]}
  onValueChange={(value) => {
    const known: { id: number }[] = value
    // @ts-expect-error `value` is a list of objects, not a list of lists.
    const wrong: { id: number }[][] = value
    void known
    void wrong
  }}
/>

// Core's combobox.
const Combobox = createParts(combobox, {
  root: "div",
  item: "div",
  chip: "div",
})
type User = { id: number; name: string }
declare const ada: User
;<Combobox.Root
  items={[{ value: ada, label: "Ada" }]}
  onValueChange={(value) => {
    const known: User | null = value
    // @ts-expect-error `value` is a user or null, not a list.
    const wrong: User[] = value
    void known
    void wrong
  }}
/>
;<Combobox.Root
  multiple
  value={[ada]}
  onValueChange={(value) => {
    const known: User[] = value
    // @ts-expect-error `value` is a list.
    const wrong: User | null = value
    void known
    void wrong
  }}
/>
;<Combobox.Root onValueChange={(value) => value?.toUpperCase()} />
// @ts-expect-error With `multiple`, the value is a list.
;<Combobox.Root multiple defaultValue="ada" />
// Items and chips take any value.
;<Combobox.Item value={ada} />
;<Combobox.Chip value={ada} />
// @ts-expect-error An item needs a value.
;<Combobox.Item />

// Core's tabs, whose parameter is a string and reaches the root's state.
const Tabs = createParts(tabs, { root: "div", tab: "button", panel: "div" })
;<Tabs.Root
  value="account"
  onValueChange={(value) => {
    const known: "account" | null = value
    // @ts-expect-error `value` is "account" or null, not a number.
    const wrong: number = value
    void known
    void wrong
  }}
  className={(state) => (state.value === "account" ? "on" : "off")}
>
  <Tabs.Tab value="account">Account</Tabs.Tab>
</Tabs.Root>
// Without a value, it's any string.
;<Tabs.Root onValueChange={(value) => value?.toUpperCase()} />
;<Tabs.Root<"account" | "billing"> defaultValue="billing" />
// @ts-expect-error Not one of the two.
;<Tabs.Root<"account" | "billing"> defaultValue="team" />
// @ts-expect-error The parameter is a string.
;<Tabs.Root<number> />
// @ts-expect-error `loop` is a boolean.
;<Tabs.Root loop="yes" />
// A tab's props don't take the parameter, so a tab isn't generic over it.
;<Tabs.Tab value="account" className={(state) => (state.selected ? "on" : "off")}>
  {(state) => (state.selected ? "Account (open)" : "Account")}
</Tabs.Tab>
