/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Tree,
  TreeGroup,
  TreeItem,
  TreeItemCheckbox,
  TreeItemIndicator,
  TreeItemLabel,
  type TreeItemData,
} from "../../src/components/tree"

const files: TreeItemData[] = [
  {
    value: "src",
    label: "src",
    children: [
      { value: "src/index.ts", label: "index.ts" },
      { value: "src/util.ts", label: "util.ts" },
    ],
  },
  { value: "docs", label: "docs", children: [{ value: "docs/guide.md", label: "guide.md" }] },
  { value: "readme", label: "README.md", href: "#readme" },
]

export function TreePage() {
  const [checked, setChecked] = useState<string[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [more, setMore] = useState(false)
  return (
    <main id="page-tree">
      <section id="markup">
        <Tree id="tree" aria-label="Places" defaultExpanded={["europe"]}>
          <TreeItem id="t-europe" value="europe">
            <TreeItemIndicator id="t-europe-ind">&gt;</TreeItemIndicator>
            <TreeItemLabel>Europe</TreeItemLabel>
            <TreeGroup id="t-europe-group">
              <TreeItem id="t-france" value="france">
                <TreeItemLabel>France</TreeItemLabel>
              </TreeItem>
              <TreeItem id="t-spain" value="spain" disabled>
                <TreeItemLabel>Spain</TreeItemLabel>
              </TreeItem>
              <TreeItem id="t-italy" value="italy">
                <TreeItemLabel>Italy</TreeItemLabel>
                <TreeGroup>
                  <TreeItem id="t-rome" value="rome">
                    <TreeItemLabel>Rome</TreeItemLabel>
                  </TreeItem>
                </TreeGroup>
              </TreeItem>
            </TreeGroup>
          </TreeItem>
          <TreeItem id="t-asia" value="asia">
            <TreeItemIndicator id="t-asia-ind">&gt;</TreeItemIndicator>
            <TreeItemLabel>Asia</TreeItemLabel>
            <TreeGroup>
              <TreeItem id="t-japan" value="japan">
                <TreeItemLabel>Japan</TreeItemLabel>
              </TreeItem>
            </TreeGroup>
          </TreeItem>
          <TreeItem id="t-oceania" value="oceania">
            <TreeItemLabel>Oceania</TreeItemLabel>
          </TreeItem>
        </Tree>
        <button id="tree-after" type="button">
          After
        </button>
      </section>
      <section id="data">
        <Tree
          id="dtree"
          aria-label="Files"
          items={more ? [...files, { value: "license", label: "LICENSE" }] : files}
          checkable
          mode="none"
          checked={checked}
          onCheckedChange={(next) => setChecked(next)}
        />
        <output id="dtree-checked">{checked.join(",")}</output>
        <button id="dtree-more" type="button" onClick={() => setMore(true)}>
          More
        </button>
      </section>
      <section id="multiple">
        <Tree id="mtree" aria-label="Many" mode="multiple" value={picked} onValueChange={(next) => setPicked(next)} paths={["a/one", "a/two", "b"]} />
        <output id="mtree-value">{picked.join(",")}</output>
      </section>
    </main>
  )
}
