/** @jsxImportSource octane */
import { useAsyncOptions } from "../../src/components/async-options"
import { Listbox, ListboxItem } from "../../src/components/listbox"

const names = ["Ada", "Alan", "Barbara", "Grace", "Linus", "Margaret"]
const calls: string[] = []
Object.assign(window, { asyncCalls: calls })

// Slower for shorter queries, so an older query answers after a newer one.
const search = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<string[]>((resolve, reject) => {
    calls.push(query)
    const timer = setTimeout(() => resolve(names.filter((name) => name.toLowerCase().includes(query.toLowerCase()))), query.length < 2 ? 300 : 60)
    signal.addEventListener("abort", () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

export function AsyncOptionsPage() {
  const people = useAsyncOptions(search, { immediate: true, debounce: 0 })
  return (
    <main id="page-async-options">
      <input id="ao-input" aria-label="Search" onInput={(event: Event) => {
          if (event.target instanceof HTMLInputElement) people.setQuery(event.target.value)
        }} />
      <output id="ao-status">{people.status}</output>
      <output id="ao-query">{people.query}</output>
      <Listbox id="ao-list" aria-label="People">
        {people.items.map((name) => (
          <ListboxItem key={name} value={name}>
            {name}
          </ListboxItem>
        ))}
      </Listbox>
      <button id="ao-reload" type="button" onClick={() => people.reload()}>
        Reload
      </button>
    </main>
  )
}
