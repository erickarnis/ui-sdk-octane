// The Octane page's stand-in for react-dom/server in a `react-ssr.tsx`
// fixture (see serverRenderedFixtures in ../vite.config.ts): the fixture's
// HTML as the preview server rendered it, for this page's URL and with the
// props the fixture gives its Fixture.
export async function serverHtml(props: Record<string, unknown>): Promise<string> {
  const request = new URLSearchParams({
    fixture: new URLSearchParams(location.search).get("fixture") ?? "",
    url: location.href,
    props: JSON.stringify(props),
  })
  const response = await fetch(`/__ssr?${request}`)
  const html = await response.text()
  if (!response.ok) throw new Error(`Server rendering failed:\n${html}`)
  return html
}
