/** @jsxImportSource octane */
// One page per component, chosen by `?page=<name>`, so a test loads each one
// fresh. Without a name it lists them.
import { createRoot } from "octane"
import { createAgent } from "@ui-sdk/core/agent"
import { pages } from "./pages"

function Index() {
  return (
    <nav>
      {Object.keys(pages).map((name) => (
        <a key={name} href={"?page=" + name}>
          {name}
        </a>
      ))}
    </nav>
  )
}

const name = new URLSearchParams(location.search).get("page") ?? ""
const Page = pages[name] ?? Index

Object.assign(window, { agent: createAgent() })
const container = document.getElementById("app")
if (container) createRoot(container).render(<Page />)
