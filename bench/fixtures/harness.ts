// What every bench fixture hands the runner: its scenarios, each a step to
// time and the untimed steps around it. Written without React or Octane, so
// the same file serves both builds.

/**
 * Real input the runner sends through the browser: a click at the centre of
 * the element a selector finds, a key, or text typed a key at a time.
 */
type Input = { click: string } | { press: string } | { type: string }

/**
 * One measured interaction. `prepare`, then the `setup` input, bring the page
 * to where the interaction starts, and `reset` back to where the next
 * `prepare` expects it; none of them is timed. `act`, then the `input`, is
 * timed, with whatever work it schedules for later frames.
 */
type Scenario = {
  prepare?: () => void
  setup?: Input[]
  act?: () => void
  input?: Input
  reset?: () => void
}

/** Item labels "Item 1" to "Item n", as upstream's perf fixtures make them. */
function items(n: number) {
  return Array.from({ length: n }, (_, index) => ({
    value: `item-${index + 1}`,
    label: `Item ${index + 1}`,
  }))
}

/** The size the page was opened with: ?n=500. */
function size(fallback: number) {
  return Number(new URLSearchParams(location.search).get("n") ?? fallback)
}

// Renders, counted where both adapters call the app back once per part
// render: a class name function.
let renders = 0
function counted(name: string) {
  return () => {
    renders++
    return name
  }
}

let mutations = 0
const observer = new MutationObserver((records) => {
  for (const record of records)
    mutations +=
      record.type === "childList"
        ? record.addedNodes.length + record.removedNodes.length
        : 1
})

function defineBench(scenarios: Record<string, Scenario>) {
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  })
  Object.assign(window, {
    __bench: {
      names: Object.keys(scenarios),
      scenario: (name: string) => scenarios[name],
      // The counts since the last call, after the observer's pending records.
      counts() {
        for (const record of observer.takeRecords())
          mutations +=
            record.type === "childList"
              ? record.addedNodes.length + record.removedNodes.length
              : 1
        const result = { renders, mutations }
        renders = 0
        mutations = 0
        return result
      },
    },
  })
}

export { counted, defineBench, items, size, type Input, type Scenario }
