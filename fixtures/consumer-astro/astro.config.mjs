import { defineConfig } from "astro/config"
import octane from "@octanejs/astro"
import { uiSdkOctane } from "ui-sdk-octane/vite"

// @octanejs/astro lets its compiler see only `@octanejs/*` and `octane` under
// node_modules, so ui-sdk-octane brings a plugin that compiles its own source.
export default defineConfig({
  devToolbar: { enabled: false },
  integrations: [octane()],
  vite: { plugins: [uiSdkOctane()] },
})
