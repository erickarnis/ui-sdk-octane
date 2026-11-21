/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createMenuController,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuContextTrigger,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemIndicator,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "../../src/components/menu"

const remote = createMenuController()

export function MenuPage() {
  const [last, setLast] = useState("none")
  const [bold, setBold] = useState(false)
  const [size, setSize] = useState("m")
  const [open, setOpen] = useState(false)
  return (
    <main id="page-menu">
      <section id="basic">
        <Menu>
          <MenuTrigger id="m-trigger">Edit</MenuTrigger>
          <MenuContent id="m">
            <MenuItem id="m-cut" value="cut" shortcut="Mod+X" onSelect={() => setLast("cut")}>
              Cut
            </MenuItem>
            <MenuItem id="m-copy" value="copy" onSelect={() => setLast("copy")}>
              Copy
            </MenuItem>
            <MenuItem id="m-disabled" value="paste" disabled>
              Paste
            </MenuItem>
            <MenuItem id="m-delete" value="delete" onSelect={() => setLast("delete")}>
              Delete
            </MenuItem>
            <MenuSeparator id="m-sep" />
            <MenuGroup id="m-group">
              <MenuGroupLabel id="m-group-label">Format</MenuGroupLabel>
              <MenuCheckboxItem
                id="m-bold"
                value="bold"
                checked={bold}
                onCheckedChange={(next) => setBold(next)}
                closeOnSelect={false}
              >
                <MenuItemIndicator id="m-bold-indicator">✓</MenuItemIndicator>
                Bold
              </MenuCheckboxItem>
            </MenuGroup>
            <MenuRadioGroup id="m-size" value={size} onValueChange={(next) => setSize(next)}>
              <MenuGroupLabel>Size</MenuGroupLabel>
              <MenuRadioItem id="m-small" value="s">
                Small
              </MenuRadioItem>
              <MenuRadioItem id="m-medium" value="m">
                Medium
              </MenuRadioItem>
            </MenuRadioGroup>
            <MenuSub>
              <MenuSubTrigger id="m-share">Share</MenuSubTrigger>
              <MenuSubContent id="m-sub">
                <MenuItem id="m-email" value="email" onSelect={() => setLast("email")}>
                  Email
                </MenuItem>
                <MenuItem id="m-link" value="link" onSelect={() => setLast("link")}>
                  Link
                </MenuItem>
              </MenuSubContent>
            </MenuSub>
          </MenuContent>
        </Menu>
        <output id="m-last">{last}</output>
        <output id="m-bold-out">{String(bold)}</output>
        <output id="m-size-out">{size}</output>
        <button id="m-after" type="button">
          After
        </button>
      </section>
      <section id="data">
        <Menu
          items={["Open", { type: "separator" }, { value: "close", label: "Close" }]}
          onAction={(value) => setLast(`data:${value}`)}
        >
          <MenuTrigger id="d-trigger">File</MenuTrigger>
        </Menu>
      </section>
      <section id="controlled">
        <Menu open={open} onOpenChange={(next) => setOpen(next)}>
          <MenuTrigger id="c-trigger">Controlled</MenuTrigger>
          <MenuContent id="c">
            <MenuItem value="one">One</MenuItem>
          </MenuContent>
        </Menu>
        <output id="c-open">{String(open)}</output>
        <button id="c-outside" type="button" onClick={() => setOpen(true)}>
          Open from outside
        </button>
      </section>
      <section id="context">
        <Menu>
          <MenuContextTrigger id="x-area" style="width:200px;height:60px;border:1px solid">
            Right-click here
          </MenuContextTrigger>
          <MenuContent id="x">
            <MenuItem id="x-reload" value="reload" onSelect={() => setLast("reload")}>
              Reload
            </MenuItem>
          </MenuContent>
        </Menu>
      </section>
      <section id="detached">
        <MenuTrigger id="r-trigger" controller={remote}>
          Remote
        </MenuTrigger>
        <Menu controller={remote}>
          <MenuContent id="r">
            <MenuItem value="a">A</MenuItem>
          </MenuContent>
        </Menu>
      </section>
    </main>
  )
}
