/** @jsxImportSource octane */
// Ported from @ui-sdk/react's toast-parts (Apache-2.0, 0.1.0-beta.13). A
// toast's content is an `OctaneNode`, which is `unknown`, so the toaster's
// content type is the one core reads by default.
import type { ToastRegionInternalOptions } from "@ui-sdk/core/renderer"
import {
  createToaster as createCoreToaster,
  toast as coreToast,
  toastRegion,
  type Toast as ToastData,
  type ToastActionProps,
  type ToastButtonState,
  type ToastCloseProps,
  type ToastItem,
  type ToastRegionOptions,
  type ToastRegionState,
  type ToastState,
  type Toaster,
} from "@ui-sdk/core/toast"
import {
  createContext,
  createElement,
  useContext,
  useId,
  type OctaneNode,
} from "octane"
import { slotIn } from "../internal.js"
import {
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import { defined } from "./octane.js"
import { renderPopup, type PopupContainer } from "./popup.js"

type RegionHandle = PrimitiveHandle<typeof toastRegion>

// The region and the toast a part belongs to.
const ToastContext = createContext<{
  region: RegionHandle
  toast: ToastData<OctaneNode>
} | null>(null)

function useToast(part: string) {
  const context = useContext(ToastContext)
  if (!context)
    throw new Error(`${part} must be used inside <Toast>, in a <ToastRegion>.`)
  return context
}

/**
 * Props for `ToastRegion`.
 */
type ToastRegionProps = Omit<
  PartProps<"section", ToastRegionState>,
  "children"
> &
  ToastRegionOptions & {
    /** Renders each toast, usually with `Toast` and its parts. Without it, each toast renders its title, description, action and cancel button. */
    children?: (
      toast: ToastData<OctaneNode>,
      item: ToastItem<OctaneNode>
    ) => OctaneNode
    /** Where the region renders. Without top layer support, the body. */
    container?: PopupContainer
  }

/**
 * Shows a toaster's toasts. Place it once, or let `<OverlayHost />` render it.
 */
function ToastRegion(props: ToastRegionProps): OctaneNode {
  return <Region {...props} placed />
}

// The region, placed by the app or rendered by the overlay host.
function Region({
  toaster,
  side,
  align,
  maxVisible,
  expanded,
  shortcut,
  pendingAnnouncement,
  debug,
  placed,
  container,
  children,
  "aria-label": label,
  ...props
}: ToastRegionProps & { placed?: boolean }): OctaneNode {
  const options: ToastRegionInternalOptions = defined({
    toaster,
    side,
    align,
    maxVisible,
    expanded,
    shortcut,
    pendingAnnouncement,
    debug,
    placed,
    label,
  })
  const region = usePrimitive(toastRegion, options)
  // Each toast with its parts, which read it from context.
  const list = (state: ToastRegionState) => {
    // Built now, as the app's `children` is called now: JSX reads its
    // children only when Octane renders the element.
    const toasts = state.toasts.map((item) => {
      const toast = item.toast
      const content = children ? children(toast, item) : <DataToast toast={toast} />
      return (
        <ToastContext key={toast.id} value={{ region, toast }}>
          {content}
        </ToastContext>
      )
    })
    return <ol {...slotIn(region, "list")}>{toasts}</ol>
  }
  const element = usePart(
    region,
    "region",
    {},
    { ...props, children: list },
    "section"
  )
  return element && renderPopup(element, container)
}

// A toast rendered from its data, with the parts.
function DataToast({ toast }: { toast: ToastData<OctaneNode> }): OctaneNode {
  return (
    <Toast>
      <div>
        {toast.title != null ? <ToastTitle /> : null}
        {toast.description != null ? <ToastDescription /> : null}
      </div>
      {toast.action ? <ToastAction /> : null}
      {/* The label is the app's content, of any type, which ToastClose's
          children don't admit: createElement doesn't check it. */}
      {toast.cancel
        ? createElement(
            ToastClose,
            defined({ action: toast.cancel.onCancel }),
            toast.cancel.label
          )
        : null}
    </Toast>
  )
}

/**
 * One toast. Swipe it toward the region's side, or press Escape on it, to dismiss it.
 */
function Toast(props: PartProps<"li", ToastState>): OctaneNode {
  const { region, toast } = useToast("Toast")
  return usePart(region, "root", { id: toast.id }, props, "li")
}

/**
 * The toast's title. Renders the toast's `title` when it has no children, and nothing when it has neither.
 */
function ToastTitle({ children, ...props }: PartProps<"div">): OctaneNode {
  const { toast } = useToast("ToastTitle")
  const content = children ?? toast.title
  return content == null ? null : (
    <TextPart text="title" {...props}>
      {content}
    </TextPart>
  )
}

/**
 * The toast's description. Renders the toast's `description` when it has no children, and nothing when it has neither.
 */
function ToastDescription({
  children,
  ...props
}: PartProps<"div">): OctaneNode {
  const { toast } = useToast("ToastDescription")
  const content = children ?? toast.description
  return content == null ? null : (
    <TextPart text="description" {...props}>
      {content}
    </TextPart>
  )
}

// A title or description with content to show.
// Its content is the app's, of any type.
function TextPart({
  text,
  ...props
}: PartProps<"div", {}, OctaneNode> & { text: "title" | "description" }) {
  const { region, toast } = useToast("ToastTitle")
  return usePart(region, text, { id: toast.id }, props)
}

type ActionPartProps = Omit<PartProps<"button", ToastButtonState>, "onAction"> &
  ToastActionProps

/**
 * The toast's action, like Undo. Renders the toast's `action` label when it
 * has no children, as a link when the action has an `href`. A Promise from its
 * handler keeps the toast open and the button pending.
 */
function ToastAction(props: ActionPartProps): OctaneNode {
  const { toast } = useToast("ToastAction")
  return toast.action || props.onAction ? <ActionPart {...props} /> : null
}

function ActionPart({
  onAction,
  dismiss,
  children,
  ...props
}: ActionPartProps) {
  const { region, toast } = useToast("ToastAction")
  const href = toast.action?.href
  const part = defined({ id: useId(), toast: toast.id, onAction, dismiss })
  // A link or a button, whose props are typed as the button's. The label is
  // the app's content, of any type.
  const element: PartProps<"button", ToastButtonState, OctaneNode> = {
    ...(href ? { href } : { type: "button" }),
    ...props,
    children: children ?? toast.action?.label,
  }
  return usePart(region, "action", part, element, href ? "a" : "button")
}

/**
 * Closes the toast. With an `action`, runs it first, and a returned Promise keeps the toast open until it settles.
 */
function ToastClose({
  action,
  ...props
}: Omit<PartProps<"button", ToastButtonState>, "action"> &
  ToastCloseProps): OctaneNode {
  const { region, toast } = useToast("ToastClose")
  const part = defined({ id: useId(), toast: toast.id, action })
  return usePart(region, "close", part, { type: "button", ...props }, "button")
}

/**
 * Shows a toast from anywhere: `toast("Saved")`, `toast.success(...)`,
 * `toast.promise(save(), { loading, success, error })`. Content can be any
 * Octane node.
 */
// SAFETY: core's shared toaster is typed for string content but stores and
// hands back whatever it's given; only the regions here render it, as nodes.
const toast = coreToast as unknown as Toaster<OctaneNode>

/**
 * Creates a queue of toasts and the function that adds to it, for a second
 * region with its own toasts. Pass it to that region as `toaster`.
 */
function createToaster<Content = OctaneNode>(
  options?: Parameters<typeof createCoreToaster>[0]
): Toaster<Content> {
  return createCoreToaster<Content>(options)
}

export {
  createToaster,
  Region,
  toast,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  type ToastRegionProps,
  ToastTitle,
}
