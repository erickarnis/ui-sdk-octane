/** @jsxImportSource octane */
import { useState } from "octane"
import {
  createDrawerController,
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerOutlet,
  DrawerTitle,
  DrawerTrigger,
} from "../../src/components/drawer"

const remote = createDrawerController()
const sheet = "height:400px;background:white;border:1px solid"

export function DrawerPage() {
  const [snap, setSnap] = useState("none")
  const [open, setOpen] = useState(false)
  return (
    <main id="page-drawer">
      <DrawerOutlet id="dr-outlet" controller={remote}>
        <section id="basic">
          <Drawer snapPoints={[0.25, 1]} onSnapPointChange={(next) => setSnap(String(next))}>
            <DrawerTrigger id="dr-trigger">Open drawer</DrawerTrigger>
            <DrawerBackdrop id="dr-backdrop" style="background:rgb(0 0 0 / 0.2)" />
            <DrawerContent id="dr" style={sheet}>
              <DrawerHandle id="dr-handle" aria-label="Resize" />
              <DrawerTitle id="dr-title">Filters</DrawerTitle>
              <DrawerDescription id="dr-description">Narrow the list.</DrawerDescription>
              <input id="dr-input" aria-label="Search" />
              <DrawerClose id="dr-close">Done</DrawerClose>
            </DrawerContent>
          </Drawer>
          <output id="dr-snap">{snap}</output>
        </section>
        <section id="controlled">
          <Drawer open={open} onOpenChange={(next) => setOpen(next)} side="end">
            <DrawerTrigger id="cdr-trigger">Controlled</DrawerTrigger>
            <DrawerContent id="cdr" aria-label="Controlled" style="width:300px;height:100%;background:white">
              <DrawerClose id="cdr-close">Close</DrawerClose>
            </DrawerContent>
          </Drawer>
          <output id="cdr-open">{String(open)}</output>
        </section>
        <section id="detached">
          <DrawerTrigger id="rdr-trigger" controller={remote}>
            Remote
          </DrawerTrigger>
          <Drawer controller={remote}>
            <DrawerContent id="rdr" aria-label="Remote" style={sheet}>
              <DrawerClose id="rdr-close">Close</DrawerClose>
            </DrawerContent>
          </Drawer>
        </section>
      </DrawerOutlet>
    </main>
  )
}
