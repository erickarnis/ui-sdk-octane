/// <reference types="vite/client" />
// The page the runner opens: `/?fixture=tabs` loads `../fixtures/tabs.tsx`,
// and `&variant=baseui` its Base UI counterpart, `tabs.baseui.tsx`. Which
// adapter renders a fixture is decided by the build (see ../vite.config.ts).
const fixtures = import.meta.glob<{ default: object }>("../fixtures/*.{tsx,tsrx}")

const params = new URLSearchParams(location.search)
const variant = params.get("variant")
const name = `../fixtures/${params.get("fixture")}`
// An Octane-only fixture is `<name>.octane.tsx`, or `.tsrx` for templates.
const load =
  variant === "baseui"
    ? fixtures[`${name}.baseui.tsx`]
    : (fixtures[`${name}.tsx`] ??
      fixtures[`${name}.octane.tsx`] ??
      fixtures[`${name}.octane.tsrx`])
if (load) {
  Object.assign(window, { __bench: (await load()).default })
  document.body.dataset.ready = ""
} else document.body.dataset.missing = ""
