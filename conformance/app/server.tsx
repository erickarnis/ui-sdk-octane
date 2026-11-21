/** @jsxImportSource octane */
/// <reference types="vite/client" />
// What the Octane page's server renders: the `vite build --ssr` entry that
// ../render.mjs loads, one fixture per process. It renders what upstream's
// `react-ssr.tsx` fixtures render with react-dom/server, the fixture in
// strict mode, but from the fixture compiled for the server, which Octane
// compiles differently from the client build the page runs.
import { StrictMode } from "octane"
import { renderToString } from "octane/server"

// Every React fixture, loaded when asked for. The page asks only for the ones
// with a react-ssr.tsx beside them.
const fixtures = import.meta.glob<{ Fixture: Fixture }>(
  "../../.upstream/apps/playground/src/fixtures/*/react.tsx"
)

type Fixture = (props: Record<string, unknown>) => unknown

export async function loadFixture(fixture: string): Promise<Fixture> {
  const load = Object.entries(fixtures).find(([file]) =>
    file.endsWith(`/fixtures/${fixture}/react.tsx`)
  )?.[1]
  if (!load) throw new Error(`No React fixture named ${fixture}.`)
  return (await load()).Fixture
}

export function renderFixture(Fixture: Fixture, props: Record<string, unknown>): string {
  return renderToString(() => (
    <StrictMode>
      <Fixture {...props} />
    </StrictMode>
  )).html
}
