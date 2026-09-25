import Link from 'next/link';
import { requireRole } from '@/lib/auth/dal';
import { getAnalystDashboardCounts } from '@/db/dashboard';
import { listAnalystQueue } from '@/db/procurement-requests';
import { StatCard, Alert, StatusBadge, Button } from '@/components/ui';
import type { RequestStatus } from '@/types/database';

/**
 * Procurement Analyst dashboard page.
 */
export default async function AnalystDashboardPage() {
  await requireRole('analyst', 'admin');
  const [counts, queueResult] = await Promise.all([
    getAnalystDashboardCounts(),
    listAnalystQueue({ page: 1, pageSize: 5 }),
  ]);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Analyst Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">Procurement Analyst</p>
      </div>

      {/* Review queue alert */}
      {counts.reviewQueue > 0 && (
        <Alert variant="info" title="Review queue" className="mb-6">
          {counts.reviewQueue} submission{counts.reviewQueue > 1 ? 's' : ''}{' '}
          {counts.reviewQueue > 1 ? 'are' : 'is'} waiting in your review queue.{' '}
          <Link href="/analyst/queue" className="underline">
            View queue
          </Link>
        </Alert>
      )}

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Review Queue"
          value={counts.reviewQueue}
          description="Submissions awaiting review"
          iconPath="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Under Review"
          value={counts.underReview}
          description="Active reviews"
          iconPath="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Approved"
          value={counts.approvedThisMonth}
          description="This month"
          iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Rejected"
          value={counts.rejectedThisMonth}
          description="This month"
          iconPath="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Queue snapshot */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Queue Snapshot</h2>
          <Link href="/analyst/queue">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {queueResult.requests.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-slate-500">Queue is empty.</p>
          ) : (
            queueResult.requests.map((req) => (
              <Link
                key={req.id}
                href={`/analyst/queue/${req.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{req.title}</p>
                  <p className="text-xs text-slate-500">{req.agency_name ?? '—'}</p>
                </div>
                <StatusBadge status={req.status as RequestStatus} dot />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
