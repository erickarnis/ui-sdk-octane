declare module "virtual:core-modules" {
  const modules: Record<string, (() => Promise<unknown>) | undefined>
  export default modules
}
declare module "tests/fixtures/page.ts" {
  export function applyFixtureOptions(): URLSearchParams
  export function loadScreenReader(): Promise<void>
}
