/** @jsxImportSource octane */
import { createColorScheme, createLocalStorage, createPreference } from "@ui-sdk/core"
import { Preferences, usePreference } from "../../src/components/preferences"

const density = createPreference({ values: ["compact", "comfortable"], defaultValue: "comfortable", attribute: "data-density", storage: createLocalStorage("density") })
const scheme = createColorScheme({ global: true, storage: createLocalStorage("scheme") })

function DensityPicker() {
  const state = usePreference(density)
  return (
    <p>
      <output id="density-value">{state.value}</output>
      <button id="density-compact" type="button" onClick={() => density.set("compact")}>
        Compact
      </button>
      <button id="scheme-dark" type="button" onClick={() => scheme.set("dark")}>
        Dark
      </button>
    </p>
  )
}

export function PreferencesPage() {
  return (
    <main id="page-preferences">
      <Preferences id="prefs" preferences={[density, scheme]} style={{ color: "black" }}>
        <DensityPicker />
      </Preferences>
    </main>
  )
}
