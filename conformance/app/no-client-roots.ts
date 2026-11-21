// What a fixture imports from react-dom/client in the server build. Its
// mount is for the browser; the server renders its Fixture alone.
function clientOnly(): never {
  throw new Error("A client root was made on the server.")
}
export const createRoot = clientOnly
export const hydrateRoot = clientOnly
