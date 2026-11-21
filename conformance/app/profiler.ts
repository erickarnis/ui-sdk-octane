/** @jsxImportSource octane */
// Stands in for React's <Profiler>, which Octane does not have, in the two
// of upstream's fixtures that count commits with it. It reports its own
// commits. React's reports those of everything inside it, so specs that
// compare commit counts are not comparable and are listed in ../known.json.
import { useLayoutEffect, type OctaneNode } from "octane"

export function Profiler({
  onRender,
  children,
}: {
  id: string
  onRender: () => void
  children?: OctaneNode
}): OctaneNode {
  useLayoutEffect(() => {
    onRender()
  }, null)
  return children
}
