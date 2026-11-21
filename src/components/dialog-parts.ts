/** @jsxImportSource octane */
// Ported from @ui-sdk/react's dialog-parts (Apache-2.0, 0.1.0-beta.13). The
// content's payload type parameter is left out, as in this adapter's parts.
import type {
  AlertDialogController,
  dialog as dialogPrimitive,
  DialogBackdropState,
  DialogCloseProps,
  DialogCloseState,
  DialogContentProps,
  DialogContentState,
  DialogController,
  DialogOptions,
  DialogShortcutProps,
  DialogShortcutState,
  DialogTriggerProps,
  DialogTriggerState,
} from "@ui-sdk/core/dialog"
import {
  createContext,
  createElement,
  useContext,
  type OctaneNode,
} from "octane"
import { HandleScope, useHandle, useNearest } from "../internal"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive"
import { defined } from "./octane"
import {
  Connected,
  renderPopup,
  useControllerEntry,
  useOwnContainer,
  usePopupContainer,
  type PopupContainer,
  type sheetViewport,
} from "./popup"

type TriggerPartProps = Omit<
  PartProps<"button", DialogTriggerState>,
  "value" | "defaultValue" | "onChange"
> &
  Omit<DialogTriggerProps, "controller">
type ContentPartProps = PartProps<"div", DialogContentState> &
  DialogContentProps
type ClosePartProps = Omit<
  PartProps<"button", DialogCloseState>,
  "value" | "action"
> &
  DialogCloseProps
type ShortcutPartProps = PartProps<"span", DialogShortcutState> &
  DialogShortcutProps

// The trigger a Shortcut part sits in, which may be outside its dialog, and its shortcut.
const TriggerContext = createContext<{ shortcut?: string | undefined } | null>(
  null
)

const text = (state: DialogShortcutState) => state.text

// Dialog and AlertDialog render the same parts over their own primitive.
// `viewport` renders the viewport around the content, for a dialog that can present as a sheet.
function dialogParts(
  primitive: typeof dialogPrimitive,
  name: string,
  viewport?: typeof sheetViewport
) {
  const parts = createParts(primitive, {
    title: "h2",
    description: "p",
    close: "button",
    trigger: "button",
  })
  // Where the popup renders. Set on the root or the content.
  const ContainerContext = createContext<PopupContainer>(undefined)

  function Root({
    children,
    container,
    ...options
  }: DialogOptions & { children?: OctaneNode }) {
    const handle = usePrimitive(primitive, options)
    useControllerEntry(options.controller, handle)
    return createElement(
      HandleScope,
      { handle },
      createElement(ContainerContext, { value: container }, children)
    )
  }

  function Trigger({
    controller,
    ...props
  }: TriggerPartProps & {
    controller?:
      | DialogController<unknown, unknown>
      | AlertDialogController<unknown, unknown>
      | undefined
  }) {
    const {
      disabled,
      focusableWhenDisabled,
      payload: _,
      shortcut,
      render,
      ...rest
    } = props
    // Until the dialog it names mounts, a trigger outside the dialog is a plain button.
    const unconnected = () =>
      renderElement(
        "button",
        {
          type: "button",
          disabled: disabled && !focusableWhenDisabled,
          "aria-disabled": (disabled && focusableWhenDisabled) || undefined,
          ...rest,
        },
        render,
        { open: false, disabled: !!disabled }
      )
    return createElement(
      TriggerContext,
      { value: { shortcut } },
      createElement(
        Connected,
        { primitive, controller, fallback: unconnected },
        createElement(parts.Trigger, defined(props))
      )
    )
  }

  function Backdrop(props: PartProps<"div", DialogBackdropState>) {
    const target = usePopupContainer(useContext(ContainerContext))
    const element = usePart(primitive, "backdrop", {}, props)
    return element && renderPopup(element, target)
  }

  function Content({
    initialFocus,
    finalFocus,
    keepMounted,
    inline,
    container,
    render,
    ...props
  }: ContentPartProps) {
    const handle = useHandle(primitive)
    const target = usePopupContainer(
      useOwnContainer(container, ContainerContext)
    )
    const element = usePart(
      handle,
      "content",
      defined({ initialFocus, finalFocus, keepMounted, inline }),
      defined({
        ...props,
        render: viewport ? viewport(handle, render) : render,
      })
    )
    return element && (inline ? element : renderPopup(element, target))
  }

  function ShortcutPart({
    inherited,
    shortcut,
    children = text,
    ...props
  }: ShortcutPartProps & { inherited?: string | undefined }) {
    return usePart(
      primitive,
      "shortcut",
      defined({ shortcut: shortcut ?? inherited }),
      { ...props, children },
      "span"
    )
  }

  function Shortcut(props: ShortcutPartProps): OctaneNode {
    const trigger = useContext(TriggerContext)
    if (useNearest(primitive))
      return createElement(ShortcutPart, {
        ...props,
        inherited: trigger?.shortcut,
      })
    // Inside a trigger whose dialog hasn't mounted yet, there's no shortcut to show.
    if (trigger) return null
    throw new Error(`${name} parts must be used inside <${name}>.`)
  }

  return {
    Root,
    Trigger,
    Backdrop,
    Content,
    Title: parts.Title,
    Description: parts.Description,
    Close: parts.Close,
    Shortcut,
  }
}

export {
  type ClosePartProps,
  type ContentPartProps,
  dialogParts,
  type ShortcutPartProps,
  type TriggerPartProps,
}
