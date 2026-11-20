import type { OctaneNode } from "octane"
import { AccordionPage } from "./accordion"
import { CheckboxPage } from "./checkbox"
import { CollapsiblePage } from "./collapsible"
import { RadioPage } from "./radio"
import { SwitchPage } from "./switch"
import { TabsPage } from "./tabs"
import { TogglePage } from "./toggle"
import { ToolbarPage } from "./toolbar"

export const pages: Record<string, () => OctaneNode> = {
  accordion: AccordionPage,
  checkbox: CheckboxPage,
  collapsible: CollapsiblePage,
  radio: RadioPage,
  switch: SwitchPage,
  tabs: TabsPage,
  toggle: TogglePage,
  toolbar: ToolbarPage,
}
