// The component pages, apart from the adapter's own harness one level up:
// `pnpm exec vite --config playground/components/vite.config.ts` serves them,
// and `vite build` with the same config writes the production build that
// `vite preview` serves.
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { octane } from "octane/compiler/vite"

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [octane({ requireDirective: true })],
  server: { port: 4431, host: "127.0.0.1", strictPort: true },
  preview: { port: 4432, host: "127.0.0.1", strictPort: true },
  build: { outDir: "../../.playground-dist/components", emptyOutDir: true },
})
