/** @jsxImportSource octane */
import { useState } from "octane"
import { Avatar, AvatarFallback, AvatarImage } from "../../src/components/avatar"

// A one-pixel PNG, so the image loads without the network.
const pixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

export function AvatarPage() {
  const [statuses, setStatuses] = useState<string[]>([])
  return (
    <main id="page-avatar">
      <Avatar id="ok" onLoadingStatusChange={(status) => setStatuses((list) => [...list, status])}>
        <AvatarImage id="ok-img" src={pixel} alt="Ada" />
        <AvatarFallback id="ok-fallback">AL</AvatarFallback>
      </Avatar>
      <output id="ok-statuses">{statuses.join(",")}</output>
      <Avatar id="broken">
        <AvatarImage id="broken-img" src="data:image/png;base64,AAAA" alt="Grace" />
        <AvatarFallback id="broken-fallback">GH</AvatarFallback>
      </Avatar>
      <Avatar id="late">
        <AvatarFallback id="late-fallback" delay={1500}>
          LT
        </AvatarFallback>
      </Avatar>
    </main>
  )
}
