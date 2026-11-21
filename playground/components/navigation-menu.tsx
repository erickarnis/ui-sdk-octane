/** @jsxImportSource octane */
import { useState } from "octane"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../../src/components/navigation-menu"

export function NavigationMenuPage() {
  const [value, setValue] = useState<string | null>(null)
  return (
    <main id="page-navigation-menu">
      <button id="nm-before" type="button">
        Before
      </button>
      <NavigationMenu id="nm" aria-label="Main" delay={100} closeDelay={100}>
        <NavigationMenuList id="nm-list" style="display:flex;gap:16px;list-style:none">
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger id="nm-products">Products</NavigationMenuTrigger>
            <NavigationMenuContent id="nm-products-content">
              <NavigationMenuLink id="nm-editor" href="#editor">
                Editor
              </NavigationMenuLink>
              <NavigationMenuLink id="nm-viewer" href="#viewer">
                Viewer
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="learn">
            <NavigationMenuTrigger id="nm-learn">Learn</NavigationMenuTrigger>
            <NavigationMenuContent id="nm-learn-content">
              <NavigationMenuLink id="nm-docs" href="#docs">
                Docs
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="blog">
            <NavigationMenuLink id="nm-blog" href="#blog" current>
              Blog
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator id="nm-indicator" />
        <NavigationMenuViewport id="nm-viewport" sideOffset={4} />
      </NavigationMenu>
      <NavigationMenu
        id="cnm"
        aria-label="Controlled"
        value={value}
        onValueChange={(next) => setValue(next)}
      >
        <NavigationMenuList style="list-style:none">
          <NavigationMenuItem value="more">
            <NavigationMenuTrigger id="cnm-trigger">More</NavigationMenuTrigger>
            <NavigationMenuContent id="cnm-content">
              <NavigationMenuLink id="cnm-link" href="#about">
                About
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <output id="cnm-value">{String(value)}</output>
      <button id="cnm-outside" type="button" onClick={() => setValue("more")}>
        Open from outside
      </button>
    </main>
  )
}
