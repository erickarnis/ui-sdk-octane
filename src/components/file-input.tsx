/** @jsxImportSource octane */
// Ported from @ui-sdk/react's file-input (Apache-2.0, 0.1.0-beta.13).
import {
  fileInput,
  type FileInputItemProps,
  type FileInputItemRemoveState,
  type FileInputItemState,
  type FileInputOptions,
  type FileInputState,
  type FileInputTriggerProps,
} from "@ui-sdk/core/file-input"
import * as core from "@ui-sdk/core/renderer"
import { createContext, useContext, type OctaneNode } from "octane"
import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
} from "../primitive.js"
import { useControllerEntry } from "./controller-target.js"
import { controlRender, useFieldControl } from "./field-context.js"
import { contentOf, defined } from "./octane.js"
import { Connected } from "./popup.js"

const parts = createParts(fileInput, { trigger: "button", dropzone: "div" })

// The file each repetition of a list's children shows.
const FileContext = createContext<File | null>(null)

function useItemFile(part: string, own: File | undefined) {
  const listed = useContext(FileContext)
  const file = own ?? listed
  if (!file) {
    throw new Error(
      `${part} must be used inside <FileInputList>, or be given a file.`
    )
  }
  return file
}

type DivProps<State> = Omit<
  PartProps<"div", State>,
  "defaultValue" | "onChange" | "onSelect" | "onDrop"
>
type ButtonProps<State> = Omit<
  PartProps<"button", State>,
  "name" | "form" | "value" | "onSelect"
>

/**
 * The root: it holds the files, and renders the hidden file input that opens
 * the picker and that a form submits.
 */
function FileInput({
  value,
  defaultValue,
  onValueChange,
  onReject,
  accept,
  multiple,
  directory,
  capture,
  maxFiles,
  maxSize,
  minSize,
  validate,
  name,
  form,
  required,
  disabled,
  announcement,
  controller,
  debug,
  children,
  ...props
}: FileInputOptions & DivProps<FileInputState>): OctaneNode {
  const field = useFieldControl()
  const handle = usePrimitive(
    fileInput,
    defined({
      value,
      defaultValue,
      onValueChange,
      onReject,
      accept,
      multiple,
      directory,
      capture,
      maxFiles,
      maxSize,
      minSize,
      validate,
      name: name ?? field?.name,
      form,
      required,
      disabled: disabled || field?.disabled,
      announcement,
      controller,
      debug,
    })
  )
  useControllerEntry(controller, handle)
  const content = (current: FileInputState) => {
    // Read now: JSX reads its children only when Octane renders the element.
    const body = contentOf(children, current)
    return (
      <>
        {body}
        <HiddenInput />
      </>
    )
  }
  return usePart(handle, "root", {}, { ...props, children: content })
}

// The hidden file input that opens the picker and that a form submits.
function HiddenInput() {
  return usePart(fileInput, "input", {}, {}, "input")
}

/**
 * Opens the file picker. Inside a Field, the field's label names it with the
 * button's own text. Outside the file input, it connects through `controller`.
 */
function FileInputTrigger({
  controller,
  render,
  ...props
}: ButtonProps<FileInputState> & FileInputTriggerProps): OctaneNode {
  // Until the file input it names mounts, a trigger outside it is a plain button.
  const unconnected = () =>
    renderElement(
      "button",
      { type: "button", ...props },
      render,
      unconnectedState
    )
  return (
    <Connected primitive={fileInput} controller={controller} fallback={unconnected}>
      <TriggerPart {...defined({ ...props, render })} />
    </Connected>
  )
}

const unconnectedState: FileInputState = {
  value: [],
  disabled: false,
  required: false,
  dragging: false,
}

// Inside a Field, the field's attributes for its control.
function TriggerPart({ render, ...props }: ButtonProps<FileInputState>) {
  const field = useFieldControl()
  return (
    <parts.Trigger
      {...defined({ ...props, render: controlRender(field, "button", render) })}
    />
  )
}

/**
 * Takes dropped and pasted files. Put the trigger inside it, which is how
 * keyboard and screen reader users choose files.
 */
const FileInputDropzone = parts.Dropzone

/**
 * The files, as a list. Its children render once for each file, so put a
 * FileInputItem in it.
 */
function FileInputList({
  children,
  ...props
}: Omit<DivProps<FileInputState>, "children"> & {
  children?: OctaneNode
}): OctaneNode {
  // A context is its own provider in Octane.
  const items = (state: FileInputState) =>
    state.value.map((file) => (
      <FileContext key={core.fileKey(file)} value={file}>
        {children}
      </FileContext>
    ))
  return usePart(fileInput, "list", {}, { ...props, children: items })
}

/**
 * One file. Its render state has the file, for its name, size and preview.
 * Arrow keys move between items, and Backspace or Delete removes the focused one.
 */
function FileInputItem({
  file: own,
  ...props
}: DivProps<FileInputItemState> & Partial<FileInputItemProps>): OctaneNode {
  const file = useItemFile("FileInputItem", own)
  const element = usePart(
    fileInput,
    "item",
    { file, value: core.fileKey(file) },
    props
  )
  return <FileContext value={file}>{element}</FileContext>
}

/**
 * Removes its item's file, or the `file` it's given. It's named "Remove <file
 * name>" unless you name it.
 */
function FileInputItemRemove({
  file: own,
  ...props
}: ButtonProps<FileInputItemRemoveState> &
  Partial<FileInputItemProps>): OctaneNode {
  const file = useItemFile("FileInputItemRemove", own)
  return usePart(
    fileInput,
    "item-remove",
    { file, value: core.fileKey(file) },
    props,
    "button"
  )
}

export {
  createFileInputController,
  formatFileSize,
  relativePath,
} from "@ui-sdk/core/file-input"
export type {
  FileInputApi,
  FileInputChange,
  FileInputChangeOptions,
  FileInputController,
  FileInputDropzoneProps,
  FileInputDropzoneState,
  FileInputDropzoneTarget,
  FileInputItemProps,
  FileInputItemRemoveState,
  FileInputItemState,
  FileInputOptions,
  FileInputPasteTarget,
  FileInputPrimitive,
  FileInputState,
  FileInputTriggerProps,
  FileInputValueChangeDetails,
  FileInputValueChangeReason,
  FileLike,
  FileRejection,
  FileRejectionReason,
  FileRules,
} from "@ui-sdk/core/file-input"

export {
  FileInput,
  FileInputDropzone,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
}
