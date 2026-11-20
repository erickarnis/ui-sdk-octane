# ui-sdk-octane

An unofficial Octane adapter for UI SDK (`@ui-sdk/core`, Vercel Labs, beta). `src/primitive.ts` is a port of `@ui-sdk/react`'s `use-primitive.tsx` (0.1.0-beta.13) and `src/render-element.ts` of its `render-element.ts`. The public entry is `ui-sdk-octane/primitive`: `createParts`, `usePrimitive`, `usePart`, `mergeProps`, `renderElement`.

## How Octane differs from React, for this code

Read `docs/differences-from-react.md` in the Octane repository before changing hooks. The parts that matter here:

- Hooks are keyed by a compiler-assigned slot per call site, not by call order. A hook may sit behind a condition; a hook in a plain loop is a compile error.
- A module is compiled (and its hooks slotted) only when it starts with `/** @jsxImportSource octane */`.
- An effect or memo with no dependency argument gets inferred dependencies. `null` means every render. An explicit array means exactly that array.
- The production compiler may reuse the result of a call to an imported function while its arguments are unchanged. Reads of core state go through the `core` namespace import (member calls are never reused).
- Handlers receive native events. `onFocus`/`onBlur` are `focusin`/`focusout`. There is no synthetic `onChange`; text input is `onInput`.
- A context is its own provider (`<Ctx value>`), refs are props, and a ref may be an array of refs.
- Children written in a template may arrive as a compiled block, which is a function: check `isChildrenBlock` before calling a children function.

## Rules

- Keep `src/primitive.ts` in upstream's order so the two files read side by side. Say in a comment where and why it differs.
- No implicit state machines. A flag in a closure or ref that changes what the next event does, or variables that only mean something together, become one named union state (see `Life` and `element` in `src/primitive.ts`).
- No `any`. A type assertion needs a `SAFETY:` comment stating the checked invariant; prefer a type guard or an overload.
- Comments say why, in plain words. No comment restates the code.
- `@ui-sdk/core/renderer` is not public API and can change in any release. `@ui-sdk/core` stays pinned to an exact version.
- This project is not affiliated with Vercel or the Octane project; don't write anything that implies it is.
