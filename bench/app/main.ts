/// <reference types="vite/client" />
// The page the runner opens: `/?fixture=tabs` loads `../fixtures/tabs.tsx`,
// and `&variant=baseui` its Base UI counterpart, `tabs.baseui.tsx`. Which
// adapter renders a fixture is decided by the build (see ../vite.config.ts).
const fixtures = import.meta.glob("../fixtures/*.tsx")

const params = new URLSearchParams(location.search)
const variant = params.get("variant")
const file = `../fixtures/${params.get("fixture")}${variant === "baseui" ? ".baseui" : ""}.tsx`
const load = fixtures[file]
if (load) {
  await load()
  document.body.dataset.ready = ""
} else document.body.dataset.missing = ""
