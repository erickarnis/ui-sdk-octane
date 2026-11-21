/// <reference types="vite/client" />
// Renders a fixture page the way a server does, once per root.
import { renderToReadableStream, renderToString } from "octane/server"

const pages = import.meta.glob<{ Page: (props: object) => unknown }>(
  "./pages/*.tsx"
)

export async function render(name: string, prefixes: readonly string[]) {
  const load = pages[`./pages/${name}.tsx`]
  if (!load) return undefined
  const { Page } = await load()
  return prefixes.map(
    (identifierPrefix) =>
      renderToString(Page, {}, { identifierPrefix }).html
  )
}

export async function stream(name: string, identifierPrefix: string, props: object) {
  const load = pages[`./pages/${name}.tsx`]
  if (!load) throw new Error(`No fixture page named ${name}.`)
  const { Page } = await load()
  return renderToReadableStream(Page, props, { identifierPrefix })
}
