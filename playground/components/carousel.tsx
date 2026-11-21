/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPlayToggle,
  CarouselPrevious,
  CarouselViewport,
  createCarouselController,
} from "../../src/components/carousel"

const slides = ["Red", "Green", "Blue", "Gold"]
const controller = createCarouselController()

export function CarouselPage() {
  const [page, setPage] = useState(1)
  return (
    <main id="page-carousel">
      <Carousel id="cr" aria-label="Colors" page={page} onPageChange={(next) => setPage(next)} controller={controller}>
        <CarouselViewport id="cr-viewport" style={{ width: "300px", overflow: "hidden" }}>
          <CarouselContent id="cr-content" style={{ display: "flex" }}>
            {slides.map((slide) => (
              <CarouselItem key={slide} id={"cr-" + slide} style={{ flex: "0 0 100%", height: "80px" }}>
                {slide} <a href={"#" + slide}>More</a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </CarouselViewport>
        <CarouselPrevious id="cr-prev">Previous</CarouselPrevious>
        <CarouselNext id="cr-next">Next</CarouselNext>
        <CarouselIndicatorGroup id="cr-dots" aria-label="Slides">
          {slides.map((slide, at) => (
            <CarouselIndicator key={slide} page={at + 1} aria-label={"Slide " + (at + 1)} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselPlayToggle id="cr-play">{(state) => (state.playing ? "Stop" : "Play")}</CarouselPlayToggle>
      </Carousel>
      <output id="cr-page">{String(page)}</output>
      <CarouselNext id="outside-next" controller={controller}>
        Outside next
      </CarouselNext>
    </main>
  )
}
