/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createDialogController,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogShortcut,
  DialogTitle,
  DialogTrigger,
} from "../../src/components/dialog"

const remote = createDialogController()

export function DialogPage() {
  const [open, setOpen] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [target, setTarget] = useState<HTMLElement | null>(null)
  return (
    <main id="page-dialog">
      <section id="basic">
        <Dialog>
          <DialogTrigger id="dlg-trigger">Share</DialogTrigger>
          <DialogBackdrop id="dlg-backdrop" />
          <DialogContent id="dlg">
            <DialogTitle id="dlg-title">Share link</DialogTitle>
            <DialogDescription id="dlg-description">Anyone with the link can view.</DialogDescription>
            <input id="dlg-input" aria-label="Link" defaultValue="https://example.com" />
            <button id="dlg-copy" type="button">
              Copy
            </button>
            <DialogClose id="dlg-close">Done</DialogClose>
          </DialogContent>
        </Dialog>
      </section>
      <section id="controlled">
        <Dialog
          open={open}
          onOpenChange={(next, details) => {
            setOpen(next)
            setReasons((all) => [...all, details.reason])
          }}
        >
          <DialogTrigger id="cdlg-trigger" shortcut="Mod+J">
            Controlled <DialogShortcut id="cdlg-shortcut" />
          </DialogTrigger>
          <DialogContent id="cdlg" aria-label="Controlled">
            <DialogClose id="cdlg-close">Close</DialogClose>
          </DialogContent>
        </Dialog>
        <output id="cdlg-open">{String(open)}</output>
        <output id="cdlg-reasons">{reasons.join(",")}</output>
        <button id="cdlg-outside" type="button" onClick={() => setOpen(true)}>
          Open from outside
        </button>
      </section>
      <section id="detached">
        <DialogTrigger id="rdlg-trigger" controller={remote}>
          Remote trigger
        </DialogTrigger>
        <button id="rdlg-api" type="button" onClick={() => remote.open()}>
          Open by controller
        </button>
        <Dialog controller={remote}>
          <DialogContent id="rdlg" aria-label="Remote">
            <DialogClose id="rdlg-close">Close</DialogClose>
          </DialogContent>
        </Dialog>
      </section>
      <section id="nested">
        <Dialog>
          <DialogTrigger id="outer-trigger">Outer</DialogTrigger>
          <DialogContent id="outer" aria-label="Outer">
            <Dialog>
              <DialogTrigger id="inner-trigger">Inner</DialogTrigger>
              <DialogContent id="inner" aria-label="Inner">
                <DialogClose id="inner-close">Close inner</DialogClose>
              </DialogContent>
            </Dialog>
            <DialogClose id="outer-close">Close outer</DialogClose>
          </DialogContent>
        </Dialog>
      </section>
      <section id="nonmodal">
        <Dialog modal={false}>
          <DialogTrigger id="nm-trigger">Non-modal</DialogTrigger>
          <DialogContent id="nm" aria-label="Non-modal">
            <DialogClose id="nm-close">Close</DialogClose>
          </DialogContent>
        </Dialog>
        <button id="nm-beside" type="button">
          Beside
        </button>
      </section>
      <section id="portal">
        <Dialog container={target}>
          <DialogTrigger id="pdlg-trigger">Into a container</DialogTrigger>
          <DialogContent id="pdlg" aria-label="Portaled">
            <DialogClose id="pdlg-close">Close</DialogClose>
          </DialogContent>
        </Dialog>
        <div id="portal-root" ref={setTarget} />
      </section>
    </main>
  )
}
