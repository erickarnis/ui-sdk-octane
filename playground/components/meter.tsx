/** @jsxImportSource octane */
import { useState } from "octane"
import { Meter, MeterIndicator, MeterLabel, MeterTrack, MeterValue } from "../../src/components/meter"

export function MeterPage() {
  const [value, setValue] = useState(40)
  return (
    <main id="page-meter">
      <Meter id="m" value={value}>
        <MeterLabel id="m-label">Storage</MeterLabel>
        <MeterValue id="m-value" />
        <MeterTrack>
          <MeterIndicator id="m-indicator" />
        </MeterTrack>
      </Meter>
      <button id="m-more" type="button" onClick={() => setValue(value + 25)}>
        More
      </button>
      <Meter id="g" aria-label="Disk" value={3} min={0} max={8}>
        <MeterValue id="g-value">{(state) => `${state.value} of 8 GB`}</MeterValue>
      </Meter>
    </main>
  )
}
