# ui-sdk-octane

**[UI SDK](https://github.com/vercel-labs/ui) for [Octane](https://github.com/octanejs/octane).** Every UI SDK component and behavior, rendered by Octane.

UI SDK ships adapters for React, Vue, Svelte, Solid and Web Components. This is one for Octane: a port of `@ui-sdk/react`, with the same components under the same names.

- **All 67 component entries** `@ui-sdk/react` exports, plus `createParts`, `usePrimitive` and `usePart` for components of your own.
- **Passes UI SDK's own test suite.** 7,524 of upstream's Playwright tests run unchanged against this adapter and pass, server rendering included. The 6 that fail, two accessibility checks of the tree in three variants, also fail on `@ui-sdk/react`.
- **Written as Octane, not as React.** JSX that Octane compiles, hook dependencies it infers, the browser's own events.
- **About as fast as `@ui-sdk/react`.** On the same fixtures it takes 0.9 to 1.8 times as long, 1.0 to 1.2 times for most, and most of that time is Octane's and core's, not the adapter's (`pnpm bench`).
- **Vite and Astro**, on Octane 0.23.1.

> **Unofficial and experimental.** Not affiliated with Vercel or the Octane project. UI SDK and Octane are both in beta, and each release of this package works with exactly one version of `@ui-sdk/core`. It is not on npm yet.

## Use

```tsx
/** @jsxImportSource octane */
import { Tabs, TabsList, TabsPanel, TabsTab } from "ui-sdk-octane/tabs"

export function Example() {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Sections">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="activity">Activity</TabsTab>
      </TabsList>
      <TabsPanel value="overview">Overview</TabsPanel>
      <TabsPanel value="activity">Activity</TabsPanel>
    </Tabs>
  )
}
```

Every entry is named as in `@ui-sdk/react`: `ui-sdk-octane/select`, `/menu`, `/dialog`, `/date-picker` and so on. A primitive you define with `@ui-sdk/core` becomes components the same way:

```tsx
import { createParts } from "ui-sdk-octane/primitive"

// `muteButton` is a primitive made with core's definePrimitive.
export const { Root: MuteButton } = createParts(muteButton, { root: "button" })
```

[UI SDK's docs](https://github.com/vercel-labs/ui) cover primitives, behaviors and parts. What they say about `@ui-sdk/react` holds here, with the differences below.

## Install

Until the package is on npm, build a tarball from a checkout (`pnpm pack`) and install that. [docs/install.md](docs/install.md) has the commands and the version table.

- **Vite:** nothing to configure. `octane/compiler/vite` compiles the package's source.
- **Astro:** add the `uiSdkOctane()` plugin from `ui-sdk-octane/vite`.
- **`@ui-sdk/core`:** install exactly `0.1.0-beta.13`.

## Differences from `@ui-sdk/react`

- **Events are the browser's own.** Text input is `onInput`, as everywhere in Octane.
- **Attributes take either spelling:** `tabindex` or `tabIndex`, `class` or `className`.
- **`style` may be text** as well as an object.
- **A `render` function is typed for its part's tag.** To render another tag, pass an element (`render={<a href="#a" />}`) or type the function's first parameter as `Record<string, unknown>`.
- **Some type parameters are dropped:** the payload type of menu, hover card and drawer content, and the value type of `MenuRadioGroup` and `NavigationMenu`.

## How it is tested

| Command | What it runs |
| --- | --- |
| `pnpm conformance` | UI SDK's own Playwright specs, fetched at the commit that released the pinned core, against this adapter and against `@ui-sdk/react` as the oracle. Upstream's React fixtures are compiled for Octane as they are. |
| `pnpm test` | The adapter and `@ui-sdk/react` rendering the same source, driven with the same steps and compared. |
| `pnpm test:modes` | Server rendering, hydration, `StrictMode`, `<Activity>`, several roots on a page, transitions and Suspense. |
| `pnpm test:components` | A page of checks for every component. |
| `pnpm test:pack` | The packed tarball installed into fresh Vite and Astro projects, on the supported Octane. |
| `pnpm bench` | Not a test: the time, renders and DOM changes of mounting, updating, opening and typing, against `@ui-sdk/react` on the same fixtures, in production builds. `bench/results/baseline.json` is the reference. |

Each runs against a development and a production build, except conformance, which uses a development build as upstream's own runs do.

## Limits

- **A function as children must be the only child**, in Octane as in React.
- **Not verified:** `Preferences` rendered on a server, hot reload of a file that defines a primitive, drag and drop between lists, and browsers other than Chromium.

## Contributing

[AGENTS.md](AGENTS.md) has the rules the code follows, including how it is written for Octane ("Writing Octane"). `src/primitive.ts` is kept in the order of upstream's `use-primitive.tsx` so the two read side by side.

## License

Apache-2.0. `src/` is derived from `@ui-sdk/react`, Copyright 2026 Vercel, Inc. See [NOTICE](NOTICE).
