/** @jsxImportSource octane */
import { useState } from "octane"
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "../../src/components/progress"

export function ProgressPage() {
  const [value, setValue] = useState<number | null>(null)
  return (
    <main id="page-progress">
      <Progress id="p" value={value}>
        <ProgressLabel id="p-label">Uploading</ProgressLabel>
        <ProgressValue id="p-value" />
        <ProgressTrack>
          <ProgressIndicator id="p-indicator" />
        </ProgressTrack>
      </Progress>
      <button id="p-half" type="button" onClick={() => setValue(50)}>
        Half
      </button>
      <button id="p-done" type="button" onClick={() => setValue(100)}>
        Done
      </button>
    </main>
  )
}
