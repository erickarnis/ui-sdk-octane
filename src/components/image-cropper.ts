// Ported from @ui-sdk/react's image-cropper (Apache-2.0, 0.1.0-beta.13): the same
// parts under the same names, made by this adapter's createParts.
import { imageCropper } from "@ui-sdk/core/image-cropper"
import { createParts } from "../primitive.js"

const parts = createParts(imageCropper, {
  root: "div",
  viewport: "div",
  image: "img",
  selection: "div",
  grid: "div",
  handle: "div",
  zoom: "input",
  rotate: "button",
  flip: "button",
})

/**
 * The root: a group around the image and its controls, busy until the image loads.
 */
const ImageCropper = parts.Root

/**
 * The area the image shows in. Give it a size; its padding keeps the image
 * off its edges. In a frame, a pointer pans the image and the wheel zooms it.
 */
const ImageCropperViewport = parts.Viewport

/**
 * The image, from the root's `src`, turned and flipped. Give it an `alt`.
 */
const ImageCropperImage = parts.Image

/**
 * The crop. A pointer drags it in a box; arrows move it, plus and minus
 * zoom, and R turns the image.
 */
const ImageCropperSelection = parts.Selection

/**
 * Lines across the selection in thirds, for CSS to draw, with `data-dragging` during a drag.
 */
const ImageCropperGrid = parts.Grid

/**
 * An edge or corner of the selection, by its `position`, that resizes it in a box.
 */
const ImageCropperHandle = parts.Handle

/**
 * A range input for the zoom, from 1 to `maxZoom`.
 */
const ImageCropperZoom = parts.Zoom

/**
 * A button that turns the image a quarter clockwise.
 */
const ImageCropperRotate = parts.Rotate

/**
 * A button that mirrors the image, left to right or, with `direction="vertical"`, top to bottom.
 */
const ImageCropperFlip = parts.Flip

export { createImageCropperController } from "@ui-sdk/core/image-cropper"
export type {
  ImageCrop,
  ImageCropperApi,
  ImageCropperChangeOptions,
  ImageCropperController,
  ImageCropperCropChangeDetails,
  ImageCropperCropChangeReason,
  ImageCropperCropCommitDetails,
  ImageCropperFlipDirection,
  ImageCropperFlipProps,
  ImageCropperHandlePosition,
  ImageCropperHandleProps,
  ImageCropperHandleState,
  ImageCropperMode,
  ImageCropperOptions,
  ImageCropperPrimitive,
  ImageCropperShape,
  ImageCropperState,
  ImageRotation,
} from "@ui-sdk/core/image-cropper"

export {
  ImageCropper,
  ImageCropperFlip,
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperRotate,
  ImageCropperSelection,
  ImageCropperViewport,
  ImageCropperZoom,
}
