/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteItemText,
  AutocompleteLabel,
  AutocompleteList,
} from "../../src/components/autocomplete"
import { SubmitForm } from "./form"

const cities = ["Amsterdam", "Athens", "Berlin", "Bern", "Lisbon", "London", "Madrid", "Paris"]

export function AutocompletePage() {
  const [text, setText] = useState("")
  const [submitted, setSubmitted] = useState("")
  return (
    <main id="page-autocomplete">
      <section id="basic">
        <SubmitForm id="a-form">
          <Autocomplete name="city" defaultValue="Ber">
            <AutocompleteLabel id="a-label">City</AutocompleteLabel>
            <AutocompleteInput id="a-input" />
            <AutocompleteClear id="a-clear" aria-label="Clear">
              x
            </AutocompleteClear>
            <AutocompleteContent id="a-content">
              <AutocompleteList id="a-list">
                <AutocompleteGroup>
                  <AutocompleteGroupLabel id="a-group-label">Capitals</AutocompleteGroupLabel>
                  {cities.map((city) => (
                    <AutocompleteItem key={city} id={"a-" + city} value={city}>
                      <AutocompleteItemText />
                    </AutocompleteItem>
                  ))}
                </AutocompleteGroup>
              </AutocompleteList>
              <AutocompleteEmpty id="a-empty">No city</AutocompleteEmpty>
            </AutocompleteContent>
          </Autocomplete>
        </SubmitForm>
      </section>
      <section id="data">
        <Autocomplete items={cities} value={text} onValueChange={(next) => setText(next)} onSubmit={(value) => setSubmitted(value)}>
          <AutocompleteInput id="d-input" aria-label="Destination" />
        </Autocomplete>
        <output id="d-value">{text}</output>
        <output id="d-submitted">{submitted}</output>
        <button id="d-set" type="button" onClick={() => setText("Paris")}>
          Set from outside
        </button>
      </section>
    </main>
  )
}
