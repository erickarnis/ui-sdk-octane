/** @jsxImportSource octane */
import { useState } from "octane"
import { Menu, MenuContent, MenuItem, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger } from "../../src/components/menu"
import { Menubar } from "../../src/components/menubar"

export function MenubarPage() {
  const [last, setLast] = useState("none")
  return (
    <main id="page-menubar">
      <button id="mb-before" type="button">
        Before
      </button>
      <Menubar id="mb" aria-label="App">
        <Menu>
          <MenuTrigger id="mb-file">File</MenuTrigger>
          <MenuContent id="mb-file-menu">
            <MenuItem id="mb-new" value="new" onSelect={() => setLast("new")}>
              New
            </MenuItem>
            <MenuItem id="mb-open" value="open" onSelect={() => setLast("open")}>
              Open
            </MenuItem>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger id="mb-edit">Edit</MenuTrigger>
          <MenuContent id="mb-edit-menu">
            <MenuItem id="mb-undo" value="undo" onSelect={() => setLast("undo")}>
              Undo
            </MenuItem>
            <MenuSub>
              <MenuSubTrigger id="mb-find">Find</MenuSubTrigger>
              <MenuSubContent id="mb-find-menu">
                <MenuItem id="mb-next" value="next" onSelect={() => setLast("next")}>
                  Next
                </MenuItem>
              </MenuSubContent>
            </MenuSub>
          </MenuContent>
        </Menu>
        <Menu>
          <MenuTrigger id="mb-view">View</MenuTrigger>
          <MenuContent id="mb-view-menu">
            <MenuItem id="mb-zoom" value="zoom" onSelect={() => setLast("zoom")}>
              Zoom
            </MenuItem>
          </MenuContent>
        </Menu>
      </Menubar>
      <output id="mb-last">{last}</output>
      <button id="mb-after" type="button">
        After
      </button>
    </main>
  )
}
