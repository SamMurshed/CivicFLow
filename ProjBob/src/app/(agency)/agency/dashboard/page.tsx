import Link from 'next/link';
import { requireRole } from '@/lib/auth/dal';
import { getAgencyDashboardCounts } from '@/db/dashboard';
import { listRequests } from '@/db/procurement-requests';
import { StatCard, Alert, StatusBadge, Button } from '@/components/ui';
import type { RequestStatus } from '@/types/database';

/**
 * Agency User dashboard page.
 */
export default async function AgencyDashboardPage() {
  const user = await requireRole('agency_user');
  const [counts, recentResult] = await Promise.all([
    getAgencyDashboardCounts(),
    listRequests({ page: 1, pageSize: 5 }),
  ]);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Welcome back, {user.profile.full_name}</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {user.organization ? user.organization.name : 'Agency Portal'}
        </p>
      </div>

      {/* Correction alert */}
      {counts.awaitingCorrectionRequests > 0 && (
        <Alert variant="warning" title="Action required" className="mb-6">
          {counts.awaitingCorrectionRequests} of your procurement request
          {counts.awaitingCorrectionRequests > 1 ? 's are' : ' is'} awaiting correction information.{' '}
          <Link href="/agency/requests?status=awaiting_correction" className="underline">
            View now
          </Link>
        </Alert>
      )}

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Draft Requests"
          value={counts.draftRequests}
          description="Not yet submitted"
          iconPath="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          iconBg="bg-slate-50"
          iconColor="text-slate-600"
        />
        <StatCard
          label="Submitted"
          value={counts.submittedRequests}
          description="Awaiting analyst assignment"
          iconPath="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Active Requests"
          value={counts.activeRequests}
          description="In review or correction"
          iconPath="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Awaiting Correction"
          value={counts.awaitingCorrectionRequests}
          description="Requires your attention"
          iconPath="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Recent requests */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Procurement Requests</h2>
          <Link href="/agency/requests">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentResult.requests.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="mb-3 text-sm text-slate-500">No requests yet.</p>
              <Link href="/agency/requests/new">
                <Button size="sm">Create your first request</Button>
              </Link>
            </div>
          ) : (
            recentResult.requests.map((req) => (
              <Link
                key={req.id}
                href={`/agency/requests/${req.id}`}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50"
              >
                <p className="truncate text-sm font-medium text-slate-800">{req.title}</p>
                <StatusBadge status={req.status as RequestStatus} dot />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
