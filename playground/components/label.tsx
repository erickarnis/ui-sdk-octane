/** @jsxImportSource octane */
import { Label } from "../../src/components/label"
import { Switch, SwitchThumb } from "../../src/components/switch"

export function LabelPage() {
  return (
    <main id="page-label">
      <Label id="in-label" htmlFor="in">
        Name
      </Label>
      <input id="in" />
      <Label id="wrap-label">
        Wrapped <input id="wrapped" type="checkbox" />
      </Label>
      <Label id="sw-label" htmlFor="sw">
        Wi-Fi
      </Label>
      <Switch id="sw">
        <SwitchThumb />
      </Switch>
      <Label id="grid-label" htmlFor="grid">
        Grid
      </Label>
      <div id="grid" role="radiogroup" tabIndex={0} />
    </main>
  )
}
