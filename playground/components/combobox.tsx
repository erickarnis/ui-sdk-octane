/** @jsxImportSource octane */
import { useState } from "octane"
import { useAsyncOptions } from "../../src/components/async-options"
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxList,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
} from "../../src/components/combobox"
import { Field, FieldLabel } from "../../src/components/field"
import { SubmitForm } from "./form"

const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Lemon", "Mango"]
const people = ["Ada Lovelace", "Alan Turing", "Barbara Liskov", "Grace Hopper", "Margaret Hamilton"]
const search = (query: string) =>
  new Promise<string[]>((resolve) => setTimeout(() => resolve(people.filter((name) => name.toLowerCase().includes(query.toLowerCase()))), 80))

export function ComboboxPage() {
  const [tags, setTags] = useState<string[]>(["Lemon"])
  const [own, setOwn] = useState<string[]>(["Red", "Green"])
  const [made, setMade] = useState<string | null>(null)
  const found = useAsyncOptions(search, { debounce: 0 })
  const [person, setPerson] = useState<string | null>(null)
  return (
    <main id="page-combobox">
      <section id="basic">
        <SubmitForm id="c-form">
          <Combobox name="fruit" defaultValue="Banana">
            <ComboboxLabel id="c-label">Fruit</ComboboxLabel>
            <ComboboxInput id="c-input" />
            <ComboboxTrigger id="c-trigger">v</ComboboxTrigger>
            <ComboboxClear id="c-clear">x</ComboboxClear>
            <ComboboxContent id="c-content">
              <ComboboxList id="c-list">
                <ComboboxGroup id="c-group">
                  <ComboboxGroupLabel id="c-group-label">A</ComboboxGroupLabel>
                  <ComboboxItem id="c-Apple" value="Apple">
                    <ComboboxItemText />
                    <ComboboxItemIndicator id="c-Apple-check">*</ComboboxItemIndicator>
                  </ComboboxItem>
                  <ComboboxItem id="c-Apricot" value="Apricot" disabled>
                    <ComboboxItemText />
                  </ComboboxItem>
                </ComboboxGroup>
                {fruits.slice(2).map((name) => (
                  <ComboboxItem key={name} id={"c-" + name} value={name}>
                    <ComboboxItemText />
                  </ComboboxItem>
                ))}
              </ComboboxList>
              <ComboboxEmpty id="c-empty">No fruit</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </SubmitForm>
        <button id="c-after" type="button" style="position: absolute; top: 0; right: 0">
          After
        </button>
      </section>
      <section id="chips">
        <SubmitForm id="m-form">
          <Combobox name="tag" multiple items={fruits} value={tags} onValueChange={(next) => setTags(next)}>
            <ComboboxChips id="m-chips">
              <ComboboxValue>
                {(state: { value: unknown }) =>
                  (Array.isArray(state.value) ? state.value : []).map((value: string) => (
                    <ComboboxChip key={value} value={value} id={"m-chip-" + value}>
                      {value}
                      <ComboboxChipRemove id={"m-remove-" + value} aria-label={"Remove " + value}>
                        x
                      </ComboboxChipRemove>
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxInput id="m-input" aria-label="Tags" />
            </ComboboxChips>
          </Combobox>
          <output id="m-value">{tags.join(",")}</output>
          <button id="m-set" type="button" onClick={() => setTags(["Apple", "Mango"])}>
            Set from outside
          </button>
        </SubmitForm>
      </section>
      <section id="create">
        <Combobox items={own} value={made} onValueChange={(next) => setMade(next)}>
          <ComboboxInput id="n-input" aria-label="Colour" />
          <ComboboxContent id="n-content">
            <ComboboxList />
            <ComboboxCreate
              id="n-create"
              onCreate={(text: string) => {
                setOwn([...own, text])
                setMade(text)
              }}
            />
          </ComboboxContent>
        </Combobox>
        <output id="n-value">{made ?? "none"}</output>
      </section>
      <section id="async">
        <Combobox items={found.items} filter={false} onQueryChange={found.setQuery} value={person} onValueChange={(next) => setPerson(next)}>
          <ComboboxInput id="a-input" aria-label="Person" />
          <ComboboxContent id="a-content">
            <ComboboxStatus id="a-status">{() => (found.status === "loading" ? "Loading" : found.items.length + " results")}</ComboboxStatus>
            <ComboboxList />
          </ComboboxContent>
        </Combobox>
        <output id="a-value">{person ?? "none"}</output>
      </section>
      <section id="field">
        <Field name="city">
          <FieldLabel id="f-label">City</FieldLabel>
          <Combobox items={["Oslo", "Rome"]}>
            <ComboboxInput id="f-input" />
          </Combobox>
        </Field>
      </section>
    </main>
  )
}
