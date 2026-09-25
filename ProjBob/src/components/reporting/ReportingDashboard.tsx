import Link from 'next/link';
import { getReportingData, type ReportingFilters } from '@/db/reporting';
import { PROCUREMENT_CATEGORIES } from '@/validation/procurement-request';
import { Button, StatCard, StatusBadge } from '@/components/ui';
import type { RequestStatus } from '@/types/database';

interface Props {
  filters: ReportingFilters;
  pagePath: string;
}

const STATUS_OPTIONS: Array<{ value: RequestStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'awaiting_correction', label: 'Awaiting Correction' },
  { value: 'correction_submitted', label: 'Correction Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default async function ReportingDashboard({ filters, pagePath }: Props) {
  const { rows, metrics } = await getReportingData(filters);
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.category) query.set('category', filters.category);
  if (filters.dateFrom) query.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) query.set('dateTo', filters.dateTo);
  const maxMonthly = Math.max(...metrics.monthlyVolume.map((month) => month.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Operations Reporting</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor request volume, outcomes, processing time, and overdue work.
          </p>
        </div>
        <a href={`/api/reports/requests.csv?${query.toString()}`}>
          <Button variant="secondary" size="sm">
            Export filtered CSV
          </Button>
        </a>
      </div>

      <form
        method="GET"
        action={pagePath}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="text-xs font-medium text-slate-600">
          Status
          <select
            name="status"
            defaultValue={filters.status ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Category
          <select
            name="category"
            defaultValue={filters.category ?? ''}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">All categories</option>
            {PROCUREMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          From
          <input
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          To
          <input
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Link href={pagePath}>
            <Button variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={metrics.total}
          description="Within current filters"
        />
        <StatCard
          label="Approval Rate"
          value={`${metrics.approvalRate}%`}
          description="Approved among decided requests"
        />
        <StatCard
          label="Average Processing"
          value={`${metrics.averageProcessingDays} days`}
          description="Submission to decision"
        />
        <StatCard
          label="Overdue"
          value={metrics.overdue}
          description="Open requests past deadline"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="monthly-volume-heading"
        >
          <h2 id="monthly-volume-heading" className="text-sm font-semibold text-slate-900">
            Monthly Submission Volume
          </h2>
          {metrics.monthlyVolume.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No submitted requests match these filters.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {metrics.monthlyVolume.map((month) => (
                <li
                  key={month.month}
                  className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-xs"
                >
                  <span className="font-medium text-slate-600">{month.month}</span>
                  <span
                    className="h-3 overflow-hidden rounded-full bg-slate-100"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-blue-600"
                      style={{ width: `${(month.count / maxMonthly) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold text-slate-700 tabular-nums">
                    {month.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="status-heading"
        >
          <h2 id="status-heading" className="text-sm font-semibold text-slate-900">
            Status Distribution
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {STATUS_OPTIONS.map((option) => (
              <li
                key={option.value}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-100 p-2"
              >
                <StatusBadge status={option.value} />
                <span className="text-sm font-bold text-slate-800 tabular-nums">
                  {metrics.byStatus[option.value] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Filtered Requests</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Filtered procurement request report</caption>
            <thead className="bg-slate-50">
              <tr>
                {['Request', 'Agency', 'Category', 'Status', 'Submitted', 'Decision'].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 100).map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                  <td className="px-4 py-3 text-slate-600">{row.agency_name}</td>
                  <td className="px-4 py-3 text-slate-600">{row.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.decided_at ? new Date(row.decided_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > 100 && (
          <p className="mt-2 text-xs text-slate-500">
            Showing the first 100 rows. Export the CSV for the full filtered result.
          </p>
        )}
      </section>
    </div>
  );
}
