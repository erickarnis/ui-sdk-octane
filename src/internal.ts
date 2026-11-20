// What the component files in `./components` use beyond the public
// `primitive` entry, as @ui-sdk/react's own components reach past its
// `primitive` entry into use-primitive. Not public API: these change with
// upstream. `useHandle` is upstream's name for the nearest instance; in
// `./primitive` that name is the hook behind `usePrimitive`.
export {
  extendHandle,
  HandleScope,
  mergeRefs,
  presentIn,
  readIn,
  reading,
  sharesProps,
  slotIn,
  useAround,
  useNearest,
  useNearestHandle as useHandle,
} from "./primitive"
