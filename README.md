# ui-sdk-octane

An unofficial [Octane](https://github.com/octanejs/octane) adapter for [UI SDK](https://github.com/vercel-labs/ui) (`@ui-sdk/core`).

UI SDK is a library of interface behaviors: keyboard navigation, focus, selection, dismissal, popups, and the ARIA they need. You describe a component once as a _primitive_, and an adapter renders its parts in your framework. UI SDK ships adapters for React, Vue, Svelte, Solid and Web Components. This is one for Octane, ported from `@ui-sdk/react`.

It is not affiliated with or endorsed by Vercel or the Octane project.

> **Status: experimental.** UI SDK is in beta and so is Octane. The adapter builds on `@ui-sdk/core/renderer`, which core keeps for adapters and may change in any release, so each release of this package works with exactly one version of `@ui-sdk/core`. It is not on npm yet.

## What you get

- `createParts(primitive, tags)` makes a typed Octane component for every part of a primitive.
- `usePrimitive` and `usePart` are for parts you write by hand.
- `mergeProps` and `renderElement` are the helpers the parts themselves use.
- Every one of UI SDK's ready-made components, each under its own entry with the same names as in `@ui-sdk/react` (`ui-sdk-octane/select`, `/menu`, `/dialog`, `/date-picker` and so on): all 67 entries that package exports.

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

A primitive of your own renders the same way. This one is from UI SDK's docs:

```tsx
/** @jsxImportSource octane */
import { definePrimitive } from "@ui-sdk/core"
import { createParts } from "ui-sdk-octane/primitive"

const muteButton = definePrimitive({
  name: "mute-button",
  state: () => ({ muted: false }),
  api: (context) => ({
    toggle: () => context.store.set({ muted: !context.store.get().muted }),
  }),
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({
        type: "button",
        "aria-pressed": String(state.muted),
      }),
      press: ({ api }) => api.toggle(),
    }),
  }),
})

export const { Root: MuteButton } = createParts(muteButton, { root: "button" })
```

Every part takes `render` (an element, or a function of the props and the part's state), and `className`, `style` and `children` that may be functions of the part's state. UI SDK's own docs describe primitives, behaviors and parts; what they say about `@ui-sdk/react/primitive` holds here, with the differences below.

## Install

See [docs/install.md](docs/install.md) for the commands, the compiler setup for Vite and for Astro, and the version table. In short:

- The package ships TypeScript source, and your project's Octane compiler compiles it. With `octane/compiler/vite` that needs no setup. With `@octanejs/astro`, add the `uiSdkOctane()` plugin from `ui-sdk-octane/vite`.
- Install `@ui-sdk/core` at exactly the version this package names (`0.1.0-beta.13`).
- Octane `0.16.7` to `0.23.0` are checked.

## Differences from `@ui-sdk/react`

- **Events are the browser's own.** Handlers receive native events, and text input is `onInput`, as everywhere in Octane.
- **Attributes take either spelling.** `tabindex` and `tabIndex`, `class` and `className` are the same prop to a part.
- **`style` may be text** as well as an object.
- **A `render` function is typed for its part's tag.** To render another tag from a function, type its first parameter as props by name, or pass an element:

  ```tsx
  <TabsTab value="a" render={<a href="#a" />} />
  <TabsTab value="a" render={(props: Record<string, unknown>) => <a {...props} href="#a" />} />
  ```

- **Ids differ in spelling.** A part makes one id and derives the rest, where React makes one per id. Relationships between them (`aria-controls`, `aria-labelledby`) are the same.

## What has been checked

Every suite runs against a development build and a production build, because Octane's production compiler memoizes.

- **`pnpm test`**: Playwright tests that render each fixture through this adapter and through `@ui-sdk/react` from the same source, drive both with the same steps, and compare tags, attributes, focus, text and the callbacks the app received. They cover controlled and uncontrolled state, refused changes, roving focus, typeahead, presence, `render`, state functions, `mergeProps`, refs, keyed lists that reorder, and remounting.
- **`pnpm test:modes`**: server rendering and streaming, hydration, `StrictMode`, `<Activity>`, several roots on one page, transitions and Suspense.
- **`pnpm test:components`**: every component in a browser, on a page of its own with checks for its roles and ARIA, keyboard, focus, dismissal, and form participation where it has it.
- **`pnpm test:pack`**: the packed tarball installed into a fresh Vite project and a fresh Astro project, on the oldest and newest supported Octane, using the adapter, a simple component and one that reads its children.
- **`pnpm typecheck`**: the source and the type tests in `tests/types`.

UI SDK's agent bridge (`@ui-sdk/core/agent`) needs no adapter code and works with parts rendered here.

## Known limits

- **Each component is checked on its own page, not against React.** The side-by-side comparison with `@ui-sdk/react` covers the adapter and a handful of primitives, not all 67 components.
- **A function as children must be the only child.** `{(state) => …}` beside other children is called with nothing, in Octane as in React. Put everything inside the function.
- **Some type parameters are dropped.** `Select`, `Combobox`, `SegmentedControl` and `TriggerMenu` are generic over their value. The payload type of menu, hover card and drawer content, and the value type of `MenuRadioGroup` and `NavigationMenu`, are not carried.
- **Components that read their children** (`Select`, `Combobox`, `Autocomplete`, `Command`, `Menu`, `TriggerMenu`, `TreeItem`) rely on Octane's `descriptorChildren`, which the bundler applies through the import. That is checked for Vite and Astro. In a setup where it does not apply, a closed select cannot learn its label from its items, and a tree item needs `branch` set.
- **`Preferences` on the server is not verified.** Its inline script and hydration have only run client-side.
- Hot module replacement of a file that defines a primitive is not verified.
- Drag and drop between lists, the canvas behaviors, and scrubbing a number input under a real pointer lock have not been exercised.

## Contributing

`AGENTS.md` has the rules the code follows and the ways Octane differs from React that matter here. `src/primitive.ts` is kept in the order of upstream's `use-primitive.tsx` so the two read side by side; raising the `@ui-sdk/core` version means re-reading it against that version's React adapter.

## License

Apache-2.0. `src/` is derived from `@ui-sdk/react`, Copyright 2026 Vercel, Inc.; see [NOTICE](NOTICE).
