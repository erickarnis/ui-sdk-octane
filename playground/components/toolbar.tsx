/** @jsxImportSource octane */
import { Toggle, ToggleGroup } from "../../src/components/toggle"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
} from "../../src/components/toolbar"

export function ToolbarPage() {
  return (
    <main id="page-toolbar">
      <button id="before" type="button">
        Before
      </button>
      <section id="main">
        <Toolbar id="tb" aria-label="Formatting">
          <ToolbarButton id="tb-undo">Undo</ToolbarButton>
          <ToolbarButton id="tb-redo" disabled>
            Redo
          </ToolbarButton>
          <ToolbarSeparator id="tb-sep" />
          <Toggle id="tb-bold" aria-label="Bold">
            B
          </Toggle>
          <ToggleGroup id="tb-align" aria-label="Alignment" defaultValue={["left"]}>
            <Toggle id="tb-left" value="left">
              Left
            </Toggle>
            <Toggle id="tb-right" value="right">
              Right
            </Toggle>
          </ToggleGroup>
          <ToolbarGroup id="tb-group" disabled aria-label="Locked">
            <ToolbarButton id="tb-locked">Locked</ToolbarButton>
          </ToolbarGroup>
          <ToolbarLink id="tb-link" href="#help">
            Help
          </ToolbarLink>
          <ToolbarInput id="tb-input" aria-label="Zoom" defaultValue="100" />
        </Toolbar>
      </section>
      <button id="after" type="button">
        After
      </button>
    </main>
  )
}
