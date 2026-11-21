import { defineConfig } from "vite"
import { octane } from "octane/compiler/vite"

export default defineConfig({
  root: new URL("./site", import.meta.url).pathname,
  plugins: [octane({ requireDirective: true })],
  appType: "custom",
  logLevel: "warn",
})
