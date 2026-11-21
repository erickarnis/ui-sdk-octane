/** @jsxImportSource octane */
// Ported from @ui-sdk/react's button (Apache-2.0, 0.1.0-beta.13).
import {
  button as buttonPrimitive,
  type ButtonActionDetails,
  type ButtonOptions,
  type ButtonState,
} from "@ui-sdk/core/button"
import type { OctaneNode } from "octane"
import {
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { defined } from "./octane.js"

type ButtonProps = Omit<PartProps<"button", ButtonState>, "type" | "onClick"> &
  ButtonOptions & {
    /**
     * Runs when the button is pressed. Return a Promise to make the button
     * pending until it settles: it gets `aria-busy`, `aria-disabled` and
     * `data-pending`, keeps focus, ignores presses meanwhile, so a form can't
     * submit twice, and says `pendingAnnouncement` after a second.
     * The event's element is whatever `render` renders, like a link.
     * `details.source` says how it was pressed, for changes made after an `await`.
     */
    onClick?: (event: MouseEvent, details: ButtonActionDetails) => unknown
  }

/**
 * A button, or a link or any element that acts as one through `render`.
 */
function Button({
  disabled,
  focusableWhenDisabled,
  type,
  pendingAnnouncement,
  debug,
  onClick,
  render,
  ...props
}: ButtonProps): OctaneNode {
  const button = usePrimitive(
    buttonPrimitive,
    defined({
      disabled,
      focusableWhenDisabled,
      type,
      pendingAnnouncement,
      debug,
    })
  )
  // The part runs the press itself, so the app's handler gets the details.
  // Octane hands it the native event, so there is no second event to keep
  // in step, as upstream does with React's.
  const press = (event: MouseEvent) => {
    button.api.internal.press(event, (details) => onClick?.(event, details))
  }
  return usePart(
    button,
    "root",
    {},
    {
      ...props,
      render: (root: Props, state: ButtonState) =>
        renderElement("button", { ...root, onClick: press }, render, state),
    },
    "button"
  )
}

export { Button }
export type {
  ButtonActionDetails,
  ButtonApi,
  ButtonOptions,
  ButtonPrimitive,
  ButtonState,
} from "@ui-sdk/core/button"
