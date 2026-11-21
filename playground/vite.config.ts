import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { octane } from "octane/compiler/vite"

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [octane({ requireDirective: true })],
  server: { port: 4399, host: "127.0.0.1", strictPort: true },
  preview: { port: 4398, host: "127.0.0.1", strictPort: true },
  build: { outDir: "../.playground-dist", emptyOutDir: true },
})
