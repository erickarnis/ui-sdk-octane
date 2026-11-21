// Ported from @ui-sdk/react's avatar (Apache-2.0, 0.1.0-beta.13): the same parts
// under the same names, made by this adapter's createParts.
import { avatar } from "@ui-sdk/core/avatar"
import { createParts } from "../primitive.js"

const parts = createParts(avatar, {
  root: "span",
  image: "img",
  fallback: "span",
})

/**
 * The root: a box for the image and its fallback.
 */
const Avatar = parts.Root

/**
 * A real <img>, hidden until it loads. Every image attribute passes through,
 * like `crossOrigin`, `referrerPolicy`, `srcSet` and `sizes`.
 */
const AvatarImage = parts.Image

/**
 * Shown while there's no loaded image, after its `delay`.
 */
const AvatarFallback = parts.Fallback

export type {
  AvatarFallbackProps,
  AvatarLoadingStatus,
  AvatarLoadingStatusChangeReason,
  AvatarOptions,
  AvatarPrimitive,
  AvatarState,
} from "@ui-sdk/core/avatar"

export { Avatar, AvatarFallback, AvatarImage }
