/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
  TabsTabIcon,
} from "../../src/components/tabs"

export function TabsPage() {
  const [value, setValue] = useState("b")
  return (
    <main id="page-tabs">
      <section id="uncontrolled">
        <Tabs id="tabs" defaultValue="a">
          <TabsList aria-label="Sections">
            <TabsTab value="a">
              <TabsTabIcon>*</TabsTabIcon>Alpha
            </TabsTab>
            <TabsTab value="b">Beta</TabsTab>
            <TabsTab value="c" disabled>
              Gamma
            </TabsTab>
            <TabsTab value="d">Delta</TabsTab>
            <TabsIndicator />
          </TabsList>
          <TabsPanel value="a">Panel A</TabsPanel>
          <TabsPanel value="b">Panel B</TabsPanel>
          <TabsPanel value="c">Panel C</TabsPanel>
          <TabsPanel value="d">Panel D</TabsPanel>
        </Tabs>
      </section>
      <section id="controlled">
        <Tabs
          id="ctabs"
          value={value}
          onValueChange={(next) => setValue(next ?? "a")}
          orientation="vertical"
          activation="manual"
        >
          <TabsList aria-label="Manual">
            <TabsTab value="a">One</TabsTab>
            <TabsTab value="b">Two</TabsTab>
          </TabsList>
          <TabsPanel value="a">Manual A</TabsPanel>
          <TabsPanel value="b">Manual B</TabsPanel>
        </Tabs>
        <output id="ctabs-value">{value}</output>
      </section>
    </main>
  )
}
