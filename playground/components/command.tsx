/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemText,
  CommandList,
  CommandPage,
  CommandSeparator,
  CommandShortcut,
} from "../../src/components/command"

const data = [
  { type: "group" as const, label: "Files", items: [{ value: "open", label: "Open file", shortcut: "Mod+O" }, { value: "save", label: "Save file" }] },
  { type: "separator" as const },
  "Quit",
]


export function CommandPagePage() {
  const [ran, setRan] = useState("")
  const [query, setQuery] = useState("")
  const [dataRan, setDataRan] = useState("")
  return (
    <main id="page-command">
      <section id="markup">
        <Command id="cmd" onAction={(value) => setRan(value)} query={query} onQueryChange={(next) => setQuery(next)}>
          <CommandInput id="cmd-input" aria-label="Command" />
          <CommandList id="cmd-list">
            <CommandPage>
              <CommandGroup id="cmd-g1">
                <CommandGroupLabel id="cmd-g1-label">Edit</CommandGroupLabel>
                <CommandItem id="cmd-copy" value="copy" shortcut="Mod+Shift+C">
                  <CommandItemText>Copy text</CommandItemText>
                  <CommandShortcut id="cmd-copy-keys" />
                </CommandItem>
                <CommandItem id="cmd-paste" value="paste" disabled>
                  <CommandItemText>Paste</CommandItemText>
                </CommandItem>
                <CommandItem id="cmd-cut" value="cut" keywords={["remove"]}>
                  <CommandItemText>Cut</CommandItemText>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup id="cmd-g2">
                <CommandGroupLabel>Theme</CommandGroupLabel>
                <CommandItem id="cmd-theme" value="theme" page="themes">
                  <CommandItemText>Change theme</CommandItemText>
                </CommandItem>
              </CommandGroup>
            </CommandPage>
            <CommandPage value="themes">
              <CommandItem id="cmd-dark" value="dark">
                <CommandItemText>Dark</CommandItemText>
              </CommandItem>
              <CommandItem id="cmd-light" value="light">
                <CommandItemText>Light</CommandItemText>
              </CommandItem>
            </CommandPage>
          </CommandList>
          <CommandEmpty id="cmd-empty">Nothing found</CommandEmpty>
        </Command>
        <output id="cmd-ran">{ran}</output>
        <output id="cmd-query">{query}</output>
        <button id="cmd-set" type="button" onClick={() => setQuery("cu")}>
          Search from outside
        </button>
      </section>
      <section id="data">
        <Command id="dcmd" items={data} onAction={(value) => setDataRan(value)}>
          <CommandInput id="dcmd-input" aria-label="Data command" />
        </Command>
        <output id="dcmd-ran">{dataRan}</output>
      </section>
    </main>
  )
}
