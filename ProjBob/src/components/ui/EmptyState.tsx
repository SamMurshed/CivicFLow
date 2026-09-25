/**
 * EmptyState — full-panel empty / no-results display.
 *
 * Renders an icon, heading, optional description, and optional action.
 */

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** SVG path data for the 24×24 icon */
  iconPath?: string;
}

const DEFAULT_ICON =
  'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776';

export default function EmptyState({
  title,
  description,
  action,
  iconPath = DEFAULT_ICON,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6 text-slate-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
      <p className="mb-1 text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mb-4 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
