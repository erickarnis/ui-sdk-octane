/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "../../src/components/accordion"

const items = ["one", "two", "three"]

export function AccordionPage() {
  const [value, setValue] = useState<string[]>(["a"])
  return (
    <main id="page-accordion">
      <section id="single">
        <Accordion id="acc-single" defaultValue={["one"]}>
          {items.map((item) => (
            <AccordionItem key={item} value={item} disabled={item === "three"}>
              <AccordionHeader>
                <AccordionTrigger>Section {item}</AccordionTrigger>
              </AccordionHeader>
              <AccordionPanel>Panel {item}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <section id="multiple">
        <Accordion
          id="acc-multiple"
          multiple
          value={value}
          onValueChange={(next) => setValue(next)}
        >
          {["a", "b"].map((item) => (
            <AccordionItem key={item} value={item}>
              <AccordionHeader>
                <AccordionTrigger>Section {item}</AccordionTrigger>
              </AccordionHeader>
              <AccordionPanel keepMounted>Panel {item}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        <output id="acc-value">{value.join(",")}</output>
        <button id="acc-set" type="button" onClick={() => setValue(["b"])}>
          Open only b
        </button>
      </section>
    </main>
  )
}
