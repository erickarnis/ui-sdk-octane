import { defineConfig } from "vite"
import { octane } from "octane/compiler/vite"

// Nothing here names ui-sdk-octane. Octane's plugin finds it in this
// project's dependencies, sees that its manifest declares `octane`, and
// compiles its hooks.
export default defineConfig({
  plugins: [octane({ requireDirective: true })],
})
