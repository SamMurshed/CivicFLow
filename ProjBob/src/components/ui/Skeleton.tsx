/**
 * Skeleton — loading placeholder shapes.
 *
 * Use Skeleton.Line, Skeleton.Block, Skeleton.Circle, or the Skeleton.Card
 * preset for a full card shimmer.
 */

interface SkeletonLineProps {
  /** Width as a Tailwind class or inline style value */
  width?: string;
  className?: string;
}

interface SkeletonBlockProps {
  height?: string;
  className?: string;
}

function Line({ width = 'w-full', className = '' }: SkeletonLineProps) {
  return (
    <div
      role="status"
      aria-label="Loading…"
      className={['h-3.5 animate-pulse rounded bg-slate-200', width, className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

function Block({ height = 'h-32', className = '' }: SkeletonBlockProps) {
  return (
    <div
      role="status"
      aria-label="Loading…"
      className={['w-full animate-pulse rounded-lg bg-slate-200', height, className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

function Circle({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading…"
      className={['animate-pulse rounded-full bg-slate-200', className].filter(Boolean).join(' ')}
    />
  );
}

/** Pre-built card skeleton */
function CardPreset() {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-busy="true"
      aria-label="Loading content…"
    >
      <div className="mb-4 flex items-center gap-3">
        <Circle className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Line width="w-1/3" />
          <Line width="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Line width="w-full" />
        <Line width="w-5/6" />
        <Line width="w-3/4" />
      </div>
    </div>
  );
}

/** Pre-built table row skeleton */
function TableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white"
      aria-busy="true"
      aria-label="Loading table…"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Line width="w-1/4" />
          <Line width="w-1/3" />
          <Line width="w-1/6" className="ml-auto" />
        </div>
      ))}
    </div>
  );
}

const Skeleton = {
  Line,
  Block,
  Circle,
  Card: CardPreset,
  TableRows,
};

export default Skeleton;
