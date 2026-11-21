/** @jsxImportSource octane */
// Ported from @ui-sdk/react's async-options (Apache-2.0, 0.1.0-beta.13).
import {
  createAsyncOptions,
  type AsyncOptionsContext,
  type AsyncOptionsOptions,
} from "@ui-sdk/core/async-options"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "octane"

// Whether the component that loads is in the page. Upstream's `mounted` flag,
// named: a cleanup cancels only once the component has stayed out.
type Presence = "mounted" | "unmounted"

/**
 * Options loaded for what the user types, latest first. Pass `items`, `status`
 * and `setQuery` (as `onQueryChange`) to a combobox with `filter={false}`.
 */
function useAsyncOptions<Item>(
  load: (
    query: string,
    context: AsyncOptionsContext
  ) => Promise<Item[] | { items: Item[]; hasMore?: boolean }>,
  options?: AsyncOptionsOptions
) {
  const latest = useRef(load)
  useLayoutEffect(() => {
    latest.current = load
  }, null)
  // Nothing loads while rendering, which may repeat or be thrown away, or on
  // the server. An `immediate` load starts once the component mounts.
  const [{ helper, immediate, initial }] = useState(() => {
    const helper = createAsyncOptions<Item>(
      (query, context) => latest.current(query, context),
      {
        ...options,
        immediate: false,
      }
    )
    return {
      helper,
      immediate: !!options?.immediate,
      initial: helper.getState(),
    }
  })
  // Cancels on unmount only, not when the component leaves and comes back at once.
  const presence = useRef<Presence>("unmounted")
  useEffect(() => {
    presence.current = "mounted"
    const { status, items } = helper.getState()
    if (immediate && status === "idle" && !items.length) helper.reload()
    return () => {
      presence.current = "unmounted"
      queueMicrotask(() => {
        if (presence.current === "unmounted") helper.cancel()
      })
    }
  }, [helper, immediate])
  const state = useSyncExternalStore(
    helper.subscribe,
    helper.getState,
    helper.getState
  )
  return {
    ...state,
    // Until it starts, an immediate load shows as loading, so nothing says "no match" first.
    ...(immediate && state === initial && { status: "loading" as const }),
    setQuery: helper.setQuery,
    reload: helper.reload,
    loadMore: helper.loadMore,
  }
}

export { createAsyncOptions } from "@ui-sdk/core/async-options"
export type {
  AsyncOptions,
  AsyncOptionsContext,
  AsyncOptionsOptions,
  AsyncOptionsState,
  AsyncOptionsStatus,
} from "@ui-sdk/core/async-options"

export { useAsyncOptions }
