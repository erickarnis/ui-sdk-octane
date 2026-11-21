/** @jsxImportSource octane */
import { useState } from "octane"
import {
  ImageCropper,
  ImageCropperFlip,
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperRotate,
  ImageCropperSelection,
  ImageCropperViewport,
  ImageCropperZoom,
} from "../../src/components/image-cropper"

// A 200 by 100 image drawn here, so the page needs no network.
function picture() {
  const canvas = document.createElement("canvas")
  canvas.width = 200
  canvas.height = 100
  const context = canvas.getContext("2d")
  if (context) {
    context.fillStyle = "#4a8"
    context.fillRect(0, 0, 200, 100)
    context.fillStyle = "#a48"
    context.fillRect(0, 0, 100, 50)
  }
  return canvas.toDataURL()
}
const src = picture()

export function ImageCropperPage() {
  const [crop, setCrop] = useState("")
  const [committed, setCommitted] = useState("")
  const text = (value: { x: number; y: number; width: number; height: number; rotation?: number; flipX?: boolean }) =>
    `${value.x},${value.y},${value.width},${value.height},${value.rotation ?? 0},${String(value.flipX ?? false)}`
  return (
    <main id="page-image-cropper">
      <ImageCropper
        id="ic"
        src={src}
        defaultCrop={{ x: 50, y: 25, width: 100, height: 50 }}
        onCropChange={(next) => setCrop(text(next))}
        onCropCommit={(next) => setCommitted(text(next))}
      >
        <ImageCropperViewport id="ic-viewport" style={{ position: "relative", width: "400px", height: "200px" }}>
          <ImageCropperImage id="ic-image" alt="Squares" />
          <ImageCropperSelection id="ic-selection" style={{ outline: "1px solid red" }}>
            <ImageCropperGrid id="ic-grid" />
            <ImageCropperHandle id="ic-se" position="se" style={{ width: "10px", height: "10px", background: "red" }} />
          </ImageCropperSelection>
        </ImageCropperViewport>
        <ImageCropperZoom id="ic-zoom" />
        <ImageCropperRotate id="ic-rotate">Rotate</ImageCropperRotate>
        <ImageCropperFlip id="ic-flip">Flip</ImageCropperFlip>
      </ImageCropper>
      <output id="ic-crop">{crop}</output>
      <output id="ic-committed">{committed}</output>
    </main>
  )
}
