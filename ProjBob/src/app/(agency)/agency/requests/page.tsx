import Link from 'next/link';
import { requireRole } from '@/lib/auth/dal';
import { listRequests } from '@/db/procurement-requests';
import { StatusBadge, Button, EmptyState } from '@/components/ui';
import { PROCUREMENT_CATEGORIES } from '@/validation/procurement-request';
import type { RequestStatus } from '@/types/database';

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string; search?: string; page?: string }>;
}

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Awaiting Correction', value: 'awaiting_correction' },
  { label: 'Correction Submitted', value: 'correction_submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

export default async function AgencyRequestsPage({ searchParams }: PageProps) {
  await requireRole('agency_user');
  const params = await searchParams;

  const { status, category, search, page } = params;
  const currentPage = parseInt(page ?? '1', 10);

  const result = await listRequests({
    status: status || undefined,
    category: category || undefined,
    search: search || undefined,
    page: currentPage,
    pageSize: 20,
  });

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { status, category, search, page: '1', ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `/agency/requests${qs ? `?${qs}` : ''}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Procurement Requests</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {result.total} request{result.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/agency/requests/new">
          <Button size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" action="/agency/requests" className="mb-5 flex flex-wrap gap-3">
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search requests…"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ''}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {PROCUREMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(status || category || search) && (
          <Link href="/agency/requests">
            <Button variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </form>

      {/* List */}
      {result.requests.length === 0 ? (
        <EmptyState
          title="No requests found"
          description={
            status || category || search
              ? 'Try adjusting your filters.'
              : 'Create your first procurement request to get started.'
          }
          action={
            !status && !category && !search ? (
              <Link href="/agency/requests/new">
                <Button size="sm">New Request</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {result.requests.map((req) => (
              <li key={req.id}>
                <Link
                  href={`/agency/requests/${req.id}`}
                  className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{req.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {req.category}
                      {req.submitted_at
                        ? ` · Submitted ${new Date(req.submitted_at).toLocaleDateString()}`
                        : ` · Created ${new Date(req.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <StatusBadge status={req.status as RequestStatus} dot />
                </Link>
              </li>
            ))}
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
