'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Props = {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  /** Number currently shown on this page — used in the "Showing X of Y"
   *  caption when set. Falls back to ``pageSize``. */
  visibleCount?: number;
  onPageChange: (page: number) => void;
  /** Disable controls (e.g. while a request is in flight). */
  disabled?: boolean;
  /** Hide the "Showing X of Y results" caption. Defaults to false. */
  hideCount?: boolean;
  className?: string;
};

/**
 * Shared paginator used by team-players, footballer-management, and the
 * bulk-career-lookup player list. Replaces the three slightly-different
 * inline implementations that all did Prev / page numbers / Next.
 *
 * Page-number strategy: always show first + last + a window of up to 5
 * pages around the current one, with ellipses in the gaps. Total
 * surface stays constant regardless of ``totalPages``.
 */
export function DataPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  visibleCount,
  onPageChange,
  disabled = false,
  hideCount = false,
  className,
}: Props) {
  if (totalPages <= 1) {
    if (hideCount || totalCount === undefined) return null;
    return (
      <p className={`text-center text-sm text-gray-500 ${className ?? ''}`}>
        Showing {totalCount} {totalCount === 1 ? 'result' : 'results'}
      </p>
    );
  }

  const goTo = (page: number) => {
    if (disabled) return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const windowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const windowPages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) windowPages.push(p);

  const showLeadingFirst = windowStart > 1;
  const showLeadingEllipsis = windowStart > 2;
  const showTrailingLast = windowEnd < totalPages;
  const showTrailingEllipsis = windowEnd < totalPages - 1;

  const shown = visibleCount ?? pageSize;
  const showingCaption =
    !hideCount && totalCount !== undefined && shown !== undefined
      ? `Showing ${shown} of ${totalCount} ${totalCount === 1 ? 'result' : 'results'}`
      : null;

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ''}`}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => goTo(currentPage - 1)}
              aria-disabled={disabled || currentPage <= 1}
              className={
                disabled || currentPage <= 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>

          {showLeadingFirst && (
            <PaginationItem>
              <PaginationLink
                onClick={() => goTo(1)}
                isActive={currentPage === 1}
                className="cursor-pointer"
              >
                1
              </PaginationLink>
            </PaginationItem>
          )}
          {showLeadingEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {windowPages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                onClick={() => goTo(p)}
                isActive={p === currentPage}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {showTrailingEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {showTrailingLast && (
            <PaginationItem>
              <PaginationLink
                onClick={() => goTo(totalPages)}
                isActive={currentPage === totalPages}
                className="cursor-pointer"
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => goTo(currentPage + 1)}
              aria-disabled={disabled || currentPage >= totalPages}
              className={
                disabled || currentPage >= totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {showingCaption && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{showingCaption}</p>
      )}
    </div>
  );
}
