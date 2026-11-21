/** @jsxImportSource octane */
import { createRoot } from "octane"
import { App } from "./App"

const container = document.getElementById("app")
if (container) createRoot(container).render(<App />)
