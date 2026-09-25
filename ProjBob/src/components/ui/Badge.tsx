/**
 * Badge — small status/label chip.
 *
 * Variants map to semantic colours. Also exposes a `dot` option for a
 * leading coloured indicator dot.
 */

type BadgeVariant =
  | 'default'
  | 'blue'
  | 'green'
  | 'red'
  | 'amber'
  | 'violet'
  | 'cyan'
  | 'slate';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  slate: 'bg-slate-100 text-slate-600',
};

const DOT_CLASS: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
  slate: 'bg-slate-400',
};

export default function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASS[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_CLASS[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
