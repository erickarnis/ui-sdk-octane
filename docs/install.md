# Installing ui-sdk-octane

`ui-sdk-octane` ships its TypeScript source, and your project's Octane compiler
compiles it. That is how Octane's own packages work: every hook call needs a slot
that only the compiler assigns, and the code the compiler writes imports Octane
internals that have moved between versions. Shipping source keeps the package on
Octane's public API, so one release works across the Octane versions in the table
below. The cost is that your bundler setup has to let Octane's compiler see the
package. This page says how.

## Install

Install the adapter with the two packages it expects you to provide. Pin
`@ui-sdk/core` exactly (see [The `@ui-sdk/core` pin](#the-ui-sdkcore-pin)).

```sh
pnpm add ui-sdk-octane octane
pnpm add --save-exact @ui-sdk/core@0.1.0-beta.17
```

```sh
npm install ui-sdk-octane octane
npm install --save-exact @ui-sdk/core@0.1.0-beta.17
```

```sh
bun add ui-sdk-octane octane
bun add --exact @ui-sdk/core@0.1.0-beta.17
```

`ui-sdk-octane` must be in your project's own `dependencies` or
`devDependencies`. Octane's compiler looks for source packages there, so a copy
that only arrives through another package is not compiled.

Octane's compiler also needs the `@tsrx/oxc` version its release names as a peer
(`0.24.0` for Octane 0.25). That is part of setting up
Octane, not of this package; `npm view octane@<version> peerDependencies` prints
it.

Until the package is on npm, build a tarball from a checkout with `pnpm pack` and
install that file. Installing straight from the Git repository gives you the
source without the type declarations, because package managers do not run a
dependency's build.

## Vite

With `octane/compiler/vite` there is nothing to add:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { octane } from "octane/compiler/vite"

export default defineConfig({
  plugins: [octane({ requireDirective: true })],
})
```

Octane's plugin reads your `package.json`, finds each dependency whose own
manifest declares `octane`, and for those it compiles the source, keeps them out
of Vite's dependency prebundle and bundles them for server rendering. This
package declares `octane` as a peer dependency, which is all the plugin asks for.

`requireDirective` and the `/** @jsxImportSource octane */` pragma decide which of
your project's own files Octane compiles. They do not apply to installed
packages, so either setting works.

## Astro

`@octanejs/astro` wraps the same plugin but only lets it compile `@octanejs/*` and
`octane` under `node_modules`. Add this package's plugin, which compiles its
source with your project's Octane compiler:

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
import octane from "@octanejs/astro"
import { uiSdkOctane } from "ui-sdk-octane/vite"

export default defineConfig({
  integrations: [octane()],
  vite: { plugins: [uiSdkOctane()] },
})
```

Your own components keep the rules `@octanejs/astro` sets: with its default
`requireDirective: true`, a `.tsx` island that imports from `ui-sdk-octane`
starts with `/** @jsxImportSource octane */`.

The plugin is safe to list in a plain Vite project too. It leaves a module alone
when Octane's plugin has already compiled it.

## Use

```tsx
/** @jsxImportSource octane */
import { tabs } from "@ui-sdk/core/tabs"
import { createParts } from "ui-sdk-octane/primitive"

const Tabs = createParts(tabs, {
  root: "div",
  list: "div",
  tab: "button",
  panel: "div",
})
```

The components ported from `@ui-sdk/react` have the entries that package gives
them: `ui-sdk-octane/accordion`, `checkbox`, `collapsible`, `dialog`, `field`,
`popover`, `radio`, `switch`, `tabs`, `toggle`, `toolbar` and `tooltip`.

```tsx
import { Switch, SwitchThumb } from "ui-sdk-octane/switch"
```

Types come from declaration files in the package, so your TypeScript settings do
not apply to its source. They resolve with `"moduleResolution": "bundler"`,
`"node16"` or `"nodenext"`.

## Versions

| ui-sdk-octane | `@ui-sdk/core`           | Octane                            | Node         |
| ------------- | ------------------------ | --------------------------------- | ------------ |
| 0.0.1         | `0.1.0-beta.17`, exactly | `>=0.25.0 <0.26.0` (0.25.0)        | `>=22.22.2`  |

Each release supports the newest Octane at the time and is written for it: the
components use what that release offers (see "Writing Octane" in AGENTS.md for
which feature needs which version). 0.25.0 was checked from a packed tarball, in
a Vite project and an Astro project, in development and from a production build
(`pnpm test:pack`). The Astro project used the `@octanejs/astro` release that
names that Octane version, with Astro 7 and Vite 8, and mounts the app both in
the browser only (`client:only="octane"`) and rendered on the server and
hydrated (`client:load`).

The range stops at the newest version checked. Octane releases a minor version
every few days, and an older, unrelated package named `octane` holds versions
1.0.0 to 1.0.3 on npm, so an open range such as `>=0.25.0` would also accept
those. On a newer Octane your package manager reports the unmet peer; npm may
refuse the install until you pass `--legacy-peer-deps`. A weekly CI job runs
the same check on the newest Octane; when it passes, the next release raises
the range. The Node requirement is Octane's.

### The `@ui-sdk/core` pin

The adapter is built on `@ui-sdk/core/renderer`, which core keeps for adapters
and may change in any release, betas included. So each release of this package
names one core version, as an exact peer dependency:

- Install exactly that version, and use it for your own imports such as
  `@ui-sdk/core/tabs`. A range like `^0.1.0-beta.17` would move to the next beta.
- To move to a newer core, wait for the release of this package that names it,
  and upgrade the two together.
- The adapter and your code must load one copy of core. Core keeps its state in
  module variables, and two copies do not see each other's primitives.
- If you must try a newer core first, your package manager's `overrides` (npm,
  pnpm, Bun) can force it. The adapter is untested there.

## When it does not work

- **`useId was called without a hook slot`** (or another hook's name; in a
  production build, `Minified Octane error #15`): Octane's compiler did not
  compile this package. In a Vite project, check that
  `ui-sdk-octane` is in your `package.json` and is not listed in
  `optimizeDeps.include`. In an Astro project, add `uiSdkOctane()` as above.
- **`Cannot read properties of undefined (reading 'renders')`**, or parts that
  render but do nothing: two copies of core are loaded. Check that one version
  is installed (`pnpm why @ui-sdk/core`) and that `@ui-sdk/core` is not in
  `optimizeDeps.include`. This package asks Octane's plugin to keep core out of
  Vite's prebundle in development, so your imports and the adapter's reach the
  same files; that also means core loads as separate modules in development.
- **A peer dependency warning for `octane`**: you are on an Octane newer than the
  range above. See [Versions](#versions).

## Checking a release

```sh
pnpm check:package   # publint and attw on the packed tarball
pnpm test:pack       # install the tarball into fixtures/consumer-* and drive a browser
pnpm test:pack --octane=0.25.0 --consumer=astro --pm=bun --keep
```
