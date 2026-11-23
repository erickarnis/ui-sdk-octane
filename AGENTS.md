# ui-sdk-octane

An unofficial Octane adapter for UI SDK (`@ui-sdk/core`, Vercel Labs, beta). `src/primitive.ts` is a port of `@ui-sdk/react`'s `use-primitive.tsx` (0.1.0-beta.13) and `src/render-element.ts` of its `render-element.ts`. The public entries are `ui-sdk-octane/primitive` (`createParts`, `usePrimitive`, `usePart`, `mergeProps`, `renderElement`) and one per component, as in `@ui-sdk/react` (`ui-sdk-octane/tabs`). Each file in `src/components` is a port of the file of the same name in upstream's `packages/react/src`; `src/internal.ts` holds what those files use beyond the public entry.

## Writing Octane

The package targets the newest Octane (0.23.1; the peer range has one minor). What follows was settled from Octane's docs (`differences-from-react.md`, `tsrx-basics.md`, `signals.md`), from what `compile` in `octane/compiler` makes of each style, from Octane's own ports, and from `pnpm bench`. Read `docs/differences-from-react.md` in the Octane repository before changing hooks.

### Files

- **A file takes the name and extension of upstream's file it ports**: `tabs.tsx` for upstream's `tabs.tsx`, `children.ts` for `children.ts`. Every core release needs a re-port, and the two must read side by side.
- **Write elements as JSX in a `.tsx` file.** Octane compiles JSX in `.tsx` and `.tsrx` alike: markup with its attributes written out becomes a cloned template whose attributes update one by one, and a component element gets a call-site identity. `createElement` in a `.ts` file is the generic descriptor Octane diffs as a bag. `.tsx` costs nothing in tooling: plain `tsc` checks it and emits its declarations, and `attw` sees the same entries.
- **Keep `createElement` where upstream's `.ts` file has it** (`field-context.ts`, `primitive.ts`), so those files stay ports.
- **Don't write `.tsrx`.** It adds `@{ }` bodies, `@if`/`@for` directives, scoped styles, Strong mode and signal-bound attributes, none of which this package needs (see Signals below). Plain `tsc` can't read it: Octane's ports check it with `octane-tsc` and either ship hand-written `.tsrx.d.ts` beside each file (sonner, the TanStack ports, xstate) or leave their consumers to Octane's TypeScript plugin (base-ui). Here that would be a hand-written declaration per file.
- **Start a file with `/** @jsxImportSource octane */`** where it has JSX or hooks, so a project whose Vite plugin has `requireDirective` compiles it too. A `.tsx` file without it fails quietly: the component pages still pass, and only the conformance build stops, on `octane/jsx-dev-runtime`.
- **The conformance page and the bench take a component from `<name>.tsx` when it exists, else `<name>.ts`,** so files move one at a time. Moving one means renaming it with `git mv` and pointing its `package.json` export at the new file.

### Elements

- **A part renders its element with `createElement(tag, props)`, and keeps doing so.** Its tag is chosen at `createParts` time and its attributes are computed by core at render time, so the only template it could use spreads a bag of props, and a spread template costs more than a descriptor: updating 2,000 elements took about 1.6 times as long spread in a template as made by `createElement`, and a template with the attributes written out about 0.6 times (`pnpm bench elements`, two runs).
- **Use JSX for the adapter's own markup**, like a viewport `div` or a hidden `input`. Where its attributes come from `slotIn`, it is a spread like a part's, and the gain is the call site, not the template.
- **Read into a `const` before the JSX whatever must run now: a live value, a hook call, or any call the old `createElement` made at once.** The compiler turns an element's props into values right away but each child expression into a function it runs later, in another place. So `{state.items}` is read later than the line suggests, and `{usePart(...)}` written as a child, as upstream writes it, would run late and under another call site's slot. `const part = usePart(...)` first, then `{part}`. The same goes for `contentOf(children, state)` and for a call to the app's own render function.
- **A value typed `unknown` can't go on a typed attribute.** Build the attributes as a `Props` object and spread it (`<input {...attrs} />`) rather than asserting a type.
- **A component that reads or clones its children is marked `descriptorChildren`**, and only such a component: Select, Menu, Combobox, Autocomplete, Command, TreeItem and TriggerMenu, which look for their content part and their items' labels. Everything else takes children as a compiled block and only renders it. Check `isChildrenBlock` before calling a children function.
- **A `render` element is cloned** (`cloneElement`), so it stays a descriptor whatever file it comes from.

### Hooks

- **Leave out the dependency array.** The compiler infers it from what the callback reads, for built-in hooks in `.ts` and `.tsx` alike, and the consumer's compiler does the inferring. Write `null` for an effect that runs after every render and `[]` for one that runs once; an explicit array is taken as written. Keep an explicit array, with a comment, where the inferred one would be wrong: it would include an object made new on every render (`state` in calendar's `GridScope`), or the effect must also run for a value it does not read (`values` in preferences). Give an explicit array to a custom wrapper hook called from a `.ts` file or imported from another module: the compiler infers only calls to built-in hooks and to transparent wrappers in the same `.tsx` module.
- **A hook may sit behind a condition or after an early return;** each call site has its own slot. A hook in a plain loop is a compile error: render a component per item instead.
- **`useEffectEvent`** for a function an effect calls that must see the latest props without re-running the effect. **`useLinkedState`** for state that resets when another value changes, in place of a setter during render. **`useLazyRef(make)`** for a mutable object made once; for an object render reads, `useState(make)` and take the first item.
- **Read core through the `core` namespace** (`core.attrs(...)`), never a named import, and the adapter's own helpers that read core the same way (`internal.slotIn(...)`). Production builds may reuse the result of a call to an imported function while its arguments are unchanged; a member call is never reused, and core's reads move under the same arguments.
- **Not Strong mode.** A part's render reads core's live store and refs, which Strong's contract forbids, and Strong rejects `.tsx` modules.
- **Not `createCompiledContext`.** Its children must be written between its tags in a template, and these contexts wrap whatever the app passes.
- **No `memo` by hand.** Production builds memoize pure regions and unchanged children themselves; the parts re-render only when core says what they show changed.

### Events, props and refs

- Handlers receive the browser's own events. `onFocus`/`onBlur` are `focusin`/`focusout`. There is no synthetic `onChange`; text input is `onInput`.
- A context is its own provider (`<Ctx value>`), refs are props, and a ref may be an array of refs.

### Signals

A part re-renders through its own subscription to core (`usePartState`) when its attributes change, and core writes a slot's `direct` attributes to the element itself without a render. Binding attributes to Octane signals instead would update them without a render only in a `.tsrx` `@{ }` template: `createElement` writes a signal handle as text (`pnpm bench signals`). It would take `.tsrx` for the core, one derived signal per attribute per part, and core reporting changes per attribute, to replace work core's `direct` attributes already avoid for the attributes that change most. Not worth it now; revisit if a profile shows part renders for attribute changes dominating.

### Before and after

```ts
// switch.ts: React's way, in a .ts file
return createElement(
  parts.Root,
  defined({
    ...props,
    render: controlRender(field, "button", render, createElement(SwitchInput)),
  })
)
```

```tsx
// switch.tsx: the same, as upstream writes it
return (
  <parts.Root
    {...defined({
      ...props,
      render: controlRender(field, "button", render, <SwitchInput />),
    })}
  />
)
```

```ts
// An effect with its dependencies written out
useLayoutEffect(() => {
  tree.shown()
  return tree.hidden
}, [tree])
```

```tsx
// The compiler infers them
useLayoutEffect(() => {
  tree.shown()
  return tree.hidden
})
```

### Which Octane each needs

| What | Octane |
| --- | --- |
| Inferred dependencies, `useEffectEvent`, `useLinkedState`, `useLazyRef`, hooks behind conditions | 0.16.7 and later |
| `descriptorChildren` components without an explicit type: `DescriptorChildrenMarker` has a name (`octane/tsrx-boundary`) for declarations | 0.23.1, as checked (0.16.7 has no marker type) |
| No `settleChildren`: a popup no longer keeps the children first read inside it | 0.23.1 |

## Porting a component

- Mirror upstream's file: the same name and extension, the same parts under the same names, the same exports, a first line saying what it is a port of. Follow "Writing Octane" above.
- Relative imports name the `.js` file, and an exported function component states its return type (`OctaneNode`), so the published declarations resolve and stay free of React's types.
- Add `playground/components/<name>.tsx` exporting `<Name>Page`, and `playground/components/checks/<name>.mjs`. `pnpm test:components` drives every page in a development and a production build. A component counts once its checks pass in both.
- Check speed with `pnpm bench <fixture>` against `bench/results/baseline.json`, and add a fixture under `bench/fixtures` for a component whose cost the existing ones don't show. Before optimizing `src/primitive.ts` or `src/render-element.ts`, read `bench/notes.md`: it lists what was measured, kept and dropped.

## Conformance

`pnpm conformance` runs UI SDK's own Playwright specs against this adapter (`conformance/`, with upstream fetched into `.upstream/` at the commit that released the pinned core). A change to `src/` is not done until it passes. A test may be added to `conformance/known.json` only with its reason, found with `pnpm conformance --oracle <spec>`, which runs the same spec on `@ui-sdk/react`.

## Rules

- Keep `src/primitive.ts` in upstream's order so the two files read side by side. Say in a comment where and why it differs.
- No implicit state machines. A flag in a closure or ref that changes what the next event does, or variables that only mean something together, become one named union state (see `Life` and `element` in `src/primitive.ts`).
- No `any`. A type assertion needs a `SAFETY:` comment stating the checked invariant; prefer a type guard or an overload.
- Comments say why, in plain words. No comment restates the code.
- `@ui-sdk/core/renderer` is not public API and can change in any release. `@ui-sdk/core` stays pinned to an exact version.
- This project is not affiliated with Vercel or the Octane project; don't write anything that implies it is.
