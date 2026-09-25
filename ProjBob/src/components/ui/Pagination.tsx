'use client';

/**
 * Pagination — page navigation controls.
 *
 * Renders Previous / page numbers / Next. Calls onPageChange with the new page.
 * Page numbers are 1-indexed.
 */

import Button from './Button';

interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many pages to show around the current page (default 2) */
  sibling?: number;
}

function buildPageNumbers(current: number, total: number, sibling: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const left = Math.max(2, current - sibling);
  const right = Math.min(total - 1, current + sibling);

  pages.push(1);
  if (left > 2) pages.push('...');
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  sibling = 2,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageNumbers(currentPage, totalPages, sibling);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
      {/* Previous */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Previous
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1" role="list" aria-label="Pages">
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-slate-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              role="listitem"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={[
                'h-8 w-8 rounded-md text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {page}
            </button>
          ),
        )}
      </div>

      {/* Next */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        Next
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Button>
    </nav>
  );
}
