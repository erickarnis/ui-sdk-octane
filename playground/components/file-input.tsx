/** @jsxImportSource octane */
import { useState } from "octane"
import { Field, FieldLabel } from "../../src/components/field"
import {
  createFileInputController,
  FileInput,
  FileInputDropzone,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
} from "../../src/components/file-input"
import { SubmitForm } from "./form"

const controller = createFileInputController()

export function FileInputPage() {
  const [files, setFiles] = useState<File[]>([])
  const [rejected, setRejected] = useState("")
  return (
    <main id="page-file-input">
      <SubmitForm id="fi-form">
        <FileInput id="fi" name="docs" multiple maxSize={1000} onReject={(list) => setRejected(list.map((entry) => entry.file.name + ":" + entry.reasons.join("+")).join(","))}>
          <FileInputDropzone id="fi-drop" style={{ padding: "8px", border: "1px dashed" }}>
            <FileInputTrigger id="fi-trigger">Choose files</FileInputTrigger>
          </FileInputDropzone>
          <FileInputList id="fi-list">
            <FileInputItem>
              {(state) => (
                <>
                  <span className="name">{state.file.name}</span>
                  <FileInputItemRemove />
                </>
              )}
            </FileInputItem>
          </FileInputList>
        </FileInput>
      </SubmitForm>
      <output id="fi-rejected">{rejected}</output>
      <FileInputTrigger id="outside-trigger" controller={controller}>
        Upload avatar
      </FileInputTrigger>
      <FileInput id="cfi" controller={controller} value={files} onValueChange={(next) => setFiles([...next])} accept="image/png" />
      <output id="cfi-value">{files.map((file) => file.name).join(",")}</output>
      <Field name="resume">
        <FieldLabel id="ffi-label">Résumé</FieldLabel>
        <FileInput>
          <FileInputTrigger id="ffi-trigger">Choose</FileInputTrigger>
        </FileInput>
      </Field>
    </main>
  )
}
