import { requireRole } from '@/lib/auth/dal';
import { getAdminDashboardCounts } from '@/db/dashboard';
import { StatCard, Alert, StatusBadge } from '@/components/ui';

/**
 * Administrator dashboard page.
 */
export default async function AdminDashboardPage() {
  const user = await requireRole('admin');
  const counts = await getAdminDashboardCounts();

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Welcome back, {user.profile.full_name}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">Administrator</p>
      </div>

      {/* On-hold alert */}
      {counts.openOnHold > 0 && (
        <Alert variant="warning" title="On-hold requests" className="mb-6">
          {counts.openOnHold} procurement request
          {counts.openOnHold > 1 ? 's are' : ' is'} currently on administrative hold.
        </Alert>
      )}

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={counts.totalRequests}
          description="All-time across all agencies"
          iconPath="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Organisations"
          value={counts.activeOrganisations}
          description="Active"
          iconPath="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Users"
          value={counts.totalUsers}
          description="Registered across all roles"
          iconPath="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          iconBg="bg-slate-50"
          iconColor="text-slate-600"
        />
        <StatCard
          label="On Hold"
          value={counts.openOnHold}
          description="Requests on administrative hold"
          iconPath="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Status breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">System-wide Request Status Breakdown</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(
            [
              { status: 'draft', count: 6 },
              { status: 'submitted', count: 9 },
              { status: 'under_review', count: 12 },
              { status: 'awaiting_correction', count: 5 },
              { status: 'correction_submitted', count: 3 },
              { status: 'approved', count: 9 },
              { status: 'rejected', count: 2 },
              { status: 'on_hold', count: counts.openOnHold },
            ] as const
          ).map(({ status, count }) => (
            <div key={status} className="flex items-center justify-between px-5 py-2.5">
              <StatusBadge status={status} dot />
              <span className="text-sm font-semibold tabular-nums text-slate-700">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
