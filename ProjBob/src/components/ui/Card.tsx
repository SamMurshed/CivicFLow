/**
 * Card — generic surface container.
 *
 * Provides consistent padding, border, background, and optional section divider.
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Remove default padding (for full-bleed children like tables) */
  noPadding?: boolean;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardSection({ children, className = '' }: CardSectionProps) {
  return (
    <div className={['px-5 py-4', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export default function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        noPadding ? '' : 'p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
