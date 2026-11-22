/** @jsxImportSource octane */
// Ported from @ui-sdk/react's token-input (Apache-2.0, 0.1.0-beta.13).
import {
  tokenInput,
  type Token,
  type TokenInputEditorProps,
  type TokenInputEditorState,
  type TokenInputOptions,
  type TokenInputTokenState,
} from "@ui-sdk/core/token-input"
// A namespace, as in `../primitive`: these read what moves under the same
// arguments, and Octane's compiler never reuses a member call's result.
import * as core from "@ui-sdk/core/renderer"
import {
  createContext,
  createPortal,
  trustHTML,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type OctaneNode,
} from "octane"
import { HandleScope, useHandle } from "../internal.js"
import {
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from "../primitive.js"
import type { Props } from "../render-element.js"
import { EditorContext } from "./editor-context.js"
import { controlRender, useFieldControl } from "./field-context.js"
import { defined } from "./octane.js"

type TokenInputHandle = PrimitiveHandle<typeof tokenInput>

const TokenContext = createContext<string | null>(null)

function useTokenId(part: string) {
  const id = useContext(TokenContext)
  if (!id) throw new Error(`<${part}> must be used inside renderToken.`)
  return id
}

/**
 * The props of `TokenInput`.
 */
type TokenInputProps = TokenInputOptions & {
  children?: OctaneNode
  /** Renders a token's content, usually a TokenInputToken. Without it, tokens show their label. */
  renderToken?: (token: Token) => OctaneNode
}

/**
 * A text field with atomic tokens. A TriggerMenu inside it suggests into it.
 */
function TokenInput({
  children,
  renderToken,
  ...options
}: TokenInputProps): OctaneNode {
  const field = useFieldControl()
  const input = usePrimitive(
    tokenInput,
    defined({
      ...options,
      name: options.name ?? field?.name,
      disabled: options.disabled || field?.disabled,
    })
  )
  const custom = !!renderToken
  useLayoutEffect(() => input.api.internal.setCustom(custom))
  return (
    <HandleScope handle={input}>
      <EditorContext value={input.api.editor}>
        {children}
        {renderToken ? <Tokens input={input} renderToken={renderToken} /> : null}
        <FormInput />
      </EditorContext>
    </HandleScope>
  )
}

// Each token's content, rendered into its host in the editor.
function Tokens({
  input,
  renderToken,
}: {
  input: TokenInputHandle
  renderToken: (token: Token) => OctaneNode
}): OctaneNode {
  const version = () => core.renderVersion(input.instance)
  useSyncExternalStore(input.instance.subscribe, version, version)
  // The hosts are elements the editor holds, so they come from the instance, never a preview.
  return input.api.internal
    .hosts()
    .map(({ id, token, host }) => {
      const content = renderToken(token)
      return createPortal(
        <TokenContext value={id}>{content}</TokenContext>,
        host,
        id
      )
    })
}

// The text a form submits, while the field has a name.
function FormInput(): OctaneNode {
  const render = ({ value, ...props }: Props) => {
    // Core's values are typed `unknown`, so the props are a `Props` bag.
    const textarea: Props = { ...props, defaultValue: value }
    return props.name ? <textarea {...textarea} /> : <></>
  }
  return usePart(tokenInput, "form-input", {}, { render }, "textarea")
}

/**
 * The editable text. The core owns its content; style it, and show the placeholder with `data-empty`.
 */
function TokenInputEditor({
  placeholder,
  render,
  ...props
}: Omit<PartProps<"div", TokenInputEditorState>, "children"> &
  TokenInputEditorProps): OctaneNode {
  const input = useHandle(tokenInput)
  // The first value as markup, so a server render shows it. Octane never
  // touches it again, since the object stays the same, and leaves anything
  // typed into it before hydration to the core.
  const [html] = useState(() =>
    trustHTML(
      core.renderStaticHtml(input.state.value, input.api.internal.describe)
    )
  )
  const element = {
    ...props,
    dangerouslySetInnerHTML: html,
    suppressHydrationWarning: true,
    render: controlRender(useFieldControl(props), "div", render),
  }
  return usePart(input, "editor", defined({ placeholder }), element)
}

/**
 * A token's content, inside `renderToken`, with its state for styling.
 */
function TokenInputToken(
  props: PartProps<"span", TokenInputTokenState>
): OctaneNode {
  const id = useTokenId("TokenInputToken")
  return usePart(tokenInput, "token", { id, token: id }, props, "span")
}

/**
 * Removes its token when pressed. Hidden from assistive technology: the keyboard's way is Backspace.
 */
function TokenInputTokenRemove(props: PartProps<"span">): OctaneNode {
  const id = useTokenId("TokenInputTokenRemove")
  return usePart(tokenInput, "token-remove", { id, token: id }, props, "span")
}

export {
  createTokenInputController,
  defaultCodec,
  fromText,
  toLabel,
  toText,
} from "@ui-sdk/core/token-input"
export type {
  UndoStackOptions,
  TextEditorAdapter,
  TextRange,
  Token,
  TokenCodec,
  TokenDeletion,
  TokenInputApi,
  TokenInputChangeOptions,
  TokenInputController,
  TokenInputEditorProps,
  TokenInputEditorState,
  TokenInputOptions,
  TokenInputPrimitive,
  TokenInputTokenProps,
  TokenInputTokenState,
  TokenInputValue,
  TokenInputSubmitDetails,
  TokenInputValueChangeDetails,
  TokenInputValueChangeReason,
  TokenInsert,
} from "@ui-sdk/core/token-input"

export {
  TokenInput,
  TokenInputEditor,
  type TokenInputProps,
  TokenInputToken,
  TokenInputTokenRemove,
}
