import Link from 'next/link';
import { requireRole } from '@/lib/auth/dal';
import { listAnalystQueue } from '@/db/procurement-requests';
import { StatusBadge, Button, EmptyState } from '@/components/ui';
import { PROCUREMENT_CATEGORIES } from '@/validation/procurement-request';
import type { RequestStatus } from '@/types/database';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    category?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

const QUEUE_STATUS_OPTIONS = [
  { label: 'All queue statuses', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Awaiting Correction', value: 'awaiting_correction' },
  { label: 'Correction Submitted', value: 'correction_submitted' },
];

export default async function AnalystQueuePage({ searchParams }: PageProps) {
  await requireRole('analyst', 'admin');
  const params = await searchParams;

  const { status, category, search, dateFrom, dateTo, page } = params;
  const currentPage = parseInt(page ?? '1', 10);

  const result = await listAnalystQueue({
    status: status || undefined,
    category: category || undefined,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: currentPage,
    pageSize: 20,
  });

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { status, category, search, dateFrom, dateTo, page: '1', ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `/analyst/queue${qs ? `?${qs}` : ''}`;
  }

  const hasFilters = !!(status || category || search || dateFrom || dateTo);

  // Pre-compute "now" outside JSX to satisfy purity lint rules
  const nowMs = new Date().getTime();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Review Queue</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {result.total} request{result.total !== 1 ? 's' : ''} in queue
        </p>
      </div>

      {/* Filters */}
      <form method="GET" action="/analyst/queue" className="mb-5 flex flex-wrap gap-3">
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search requests…"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {QUEUE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ''}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {PROCUREMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          name="dateFrom"
          type="date"
          defaultValue={dateFrom}
          title="Submitted from"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="dateTo"
          type="date"
          defaultValue={dateTo}
          title="Submitted to"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {hasFilters && (
          <Link href="/analyst/queue">
            <Button variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </form>

      {/* Queue list */}
      {result.requests.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          description={hasFilters ? 'No requests match your filters.' : 'No requests awaiting review.'}
          iconPath="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {result.requests.map((req) => {
              // Oldest submitted requests appear first — flag stale items
              const submittedAt = req.submitted_at
                ? new Date(req.submitted_at)
                : null;
              const daysSince = submittedAt
                ? Math.floor(
                    (nowMs - submittedAt.getTime()) / (1000 * 60 * 60 * 24),
                  )
                : null;
              const isStale = daysSince !== null && daysSince > 7;

              return (
                <li key={req.id}>
                  <Link
                    href={`/analyst/queue/${req.id}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {req.title}
                        </p>
                        {isStale && (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            {daysSince}d old
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {req.agency_name ?? 'Unknown agency'} · {req.category}
                        {submittedAt
                          ? ` · Submitted ${submittedAt.toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <StatusBadge status={req.status as RequestStatus} dot />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-500">
                Page {result.page} of {result.totalPages}
              </span>
              <div className="flex gap-2">
                {result.page > 1 && (
                  <Link href={buildHref({ page: String(result.page - 1) })}>
                    <Button variant="secondary" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link href={buildHref({ page: String(result.page + 1) })}>
                    <Button variant="secondary" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
