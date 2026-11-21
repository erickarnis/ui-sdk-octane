// What a differential test compares: one page's DOM, focus, text and the
// callbacks its app received, in a form that is the same for both adapters
// when they behave the same.
//
// `takeSnapshot` runs inside the page, so it uses nothing from this module.

export type SnapshotNode =
  | string
  | {
      /** Where the element is, for a person: `main > div#tabs > button:nth(2)`. */
      path: string
      tag: string
      attributes: Record<string, string>
      /** Form state that isn't an attribute: `value`, `checked`, `indeterminate`. */
      properties: Record<string, string | boolean>
      children: SnapshotNode[]
    }

export type Snapshot = {
  body: SnapshotNode[]
  /** The path of the element with focus, or "(nothing)". */
  focus: string
  /** What a person can read: the page's `innerText`. */
  text: string
  /** The callbacks the app received, in order, as fixtures record them with `called`. */
  calls: unknown[][]
}

export function takeSnapshot(): Snapshot {
  // What each framework's useId makes: React's `_r_1_`, Octane's `:r0-in-1:`.
  // Each is renamed «1», «2», … in the order the page first shows it, so an
  // id made by either reads the same while every relationship between ids,
  // like `aria-controls`, and every suffix core adds, like `-tab-a`, stays.
  const generated = /_r_[0-9a-z]+_|:r[0-9a-z]+(?:-[0-9a-z]+)*:|«r[0-9a-z]+»/g
  const names = new Map<string, string>()
  const stable = (value: string) =>
    value.replace(generated, (id) => {
      let name = names.get(id)
      if (!name) names.set(id, (name = `«${names.size + 1}»`))
      return name
    })

  const paths = new Map<Element, string>()

  function attributesOf(el: Element) {
    const attributes: Record<string, string> = {}
    for (const { name, value } of [...el.attributes].sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      if (name === "style") continue
      attributes[name] =
        name === "class" ? value.trim().split(/\s+/).join(" ") : stable(value)
    }
    // The styles the browser applies, however they were written. An empty
    // `style` attribute is no style.
    const style = (el as HTMLElement).style?.cssText
    if (style) attributes.style = stable(style)
    return attributes
  }

  function propertiesOf(el: Element) {
    const properties: Record<string, string | boolean> = {}
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        properties.checked = el.checked
        properties.indeterminate = el.indeterminate
      } else properties.value = el.value
    } else if (
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    )
      properties.value = el.value
    return properties
  }

  function childrenOf(parent: Element, parentPath: string): SnapshotNode[] {
    const children: SnapshotNode[] = []
    const elements = [...parent.children].filter(
      (el) => el.tagName !== "SCRIPT"
    )
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Adjacent text is one text: how many nodes hold it is the
        // framework's business. Comments, which Octane uses as markers, are
        // skipped for the same reason.
        const last = children[children.length - 1]
        const text = node.textContent ?? ""
        if (typeof last === "string") children[children.length - 1] = last + text
        else if (text) children.push(text)
        continue
      }
      if (!(node instanceof Element) || node.tagName === "SCRIPT") continue
      const tag = node.tagName.toLowerCase()
      const id = node.getAttribute("id")
      const alike = elements.filter((el) => el.tagName === node.tagName)
      const own =
        id && !id.match(generated)
          ? `${tag}#${id}`
          : alike.length > 1
            ? `${tag}:nth(${alike.indexOf(node) + 1})`
            : tag
      const path = parentPath ? `${parentPath} > ${own}` : own
      paths.set(node, path)
      children.push({
        path,
        tag,
        attributes: attributesOf(node),
        properties: propertiesOf(node),
        // The fixture's own elements read from its root: `main > button`.
        children: childrenOf(node, id === "app" ? "" : path),
      })
    }
    return children
  }

  const body = childrenOf(document.body, "")
  const active = document.activeElement
  return {
    body,
    focus: (active && paths.get(active)) ?? "(nothing)",
    text: document.body.innerText.trim(),
    calls: window.calls ?? [],
  }
}
