/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "../../src/components/timeline"

const events = [
  { value: "ordered", title: "Ordered", date: "2026-11-01", status: "complete" },
  { value: "shipped", title: "Shipped", date: "2026-11-03", status: "current" },
  { value: "delivered", title: "Delivered", date: "2026-11-06", status: "upcoming" },
] as const

export function TimelinePage() {
  const [busy, setBusy] = useState(false)
  return (
    <main id="page-timeline">
      <Timeline id="tl" aria-label="Order">
        {events.map((event) => (
          <TimelineItem key={event.value} id={"tl-" + event.value} value={event.value} status={event.status}>
            <TimelineMarker />
            <TimelineConnector />
            <TimelineTitle>{event.title}</TimelineTitle>
            <TimelineTime dateTime={event.date}>{event.date}</TimelineTime>
            <TimelineDescription>
              Details <a href="#details">Track</a>
            </TimelineDescription>
          </TimelineItem>
        ))}
      </Timeline>
      <Timeline id="feed" aria-label="Activity" feed busy={busy}>
        <TimelineItem id="feed-1" value="1">
          <TimelineTitle>One</TimelineTitle>
        </TimelineItem>
        <TimelineItem id="feed-2" value="2">
          <TimelineTitle>Two</TimelineTitle>
        </TimelineItem>
      </Timeline>
      <button id="feed-busy" type="button" onClick={() => setBusy(!busy)}>
        Load
      </button>
    </main>
  )
}
