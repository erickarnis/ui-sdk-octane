import type { OctaneNode } from "octane"
import { AccordionPage } from "./accordion"
import { CollapsiblePage } from "./collapsible"
import { TabsPage } from "./tabs"

export const pages: Record<string, () => OctaneNode> = {
  accordion: AccordionPage,
  collapsible: CollapsiblePage,
  tabs: TabsPage,
}
