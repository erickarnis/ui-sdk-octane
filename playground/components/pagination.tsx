/** @jsxImportSource octane */
import { useState } from "octane"
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "../../src/components/pagination"

export function PaginationPage() {
  const [page, setPage] = useState(1)
  return (
    <main id="page-pagination">
      <Pagination id="pg" aria-label="Results" pageCount={10} page={page} onPageChange={(next) => setPage(next)}>
        <PaginationList id="pg-list">
          {(state) => [
            <PaginationItem key="first">
              <PaginationFirst id="pg-first">First</PaginationFirst>
            </PaginationItem>,
            <PaginationItem key="prev">
              <PaginationPrevious id="pg-prev">Previous</PaginationPrevious>
            </PaginationItem>,
            ...state.items.map((item, at) => (
              <PaginationItem key={"i" + at}>{typeof item === "number" ? <PaginationLink page={item} /> : <PaginationEllipsis />}</PaginationItem>
            )),
            <PaginationItem key="next">
              <PaginationNext id="pg-next">Next</PaginationNext>
            </PaginationItem>,
            <PaginationItem key="last">
              <PaginationLast id="pg-last">Last</PaginationLast>
            </PaginationItem>,
          ]}
        </PaginationList>
      </Pagination>
      <output id="pg-value">{String(page)}</output>
      <Pagination id="links" aria-label="Pages" pageCount={3} defaultPage={2} getHref={(at) => "#page-" + at}>
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious id="links-prev">Previous</PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink id="links-1" page={1} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink id="links-2" page={2}>
              Two
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink id="links-3" page={3} />
          </PaginationItem>
        </PaginationList>
      </Pagination>
    </main>
  )
}
