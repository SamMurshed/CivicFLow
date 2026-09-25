/**
 * StatCard — metric tile for dashboards.
 *
 * Shows a label, numeric value, optional trend, and optional icon.
 */

interface StatCardProps {
  label: string;
  value: number | string;
  description?: string;
  /** SVG path data for 24×24 icon */
  iconPath?: string;
  /** Accent colour class (Tailwind bg-* for icon bg, text-* for icon colour) */
  iconBg?: string;
  iconColor?: string;
}

export default function StatCard({
  label,
  value,
  description,
  iconPath,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-600',
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {iconPath && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`h-5 w-5 ${iconColor}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
