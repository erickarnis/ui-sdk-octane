/** @jsxImportSource octane */
// The parts every mode fixture renders, made once per module graph.
import { tabs } from "@ui-sdk/core/tabs"
import { createParts } from "../../../src/primitive"
import { muteButton, rating } from "../../../playground/primitives"

export const { Root: MuteButton } = createParts(muteButton, { root: "button" })
export const { Root: Rating, Star } = createParts(rating, {
  root: "div",
  star: "button",
})
export const Tabs = createParts(tabs, {
  root: "div",
  list: "div",
  tab: "button",
  panel: "div",
})
