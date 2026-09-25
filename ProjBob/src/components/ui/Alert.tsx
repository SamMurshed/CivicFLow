/**
 * Alert — inline notification banner.
 *
 * Variants: info | success | warning | error
 * Optionally dismissible.
 */

'use client';

import { useState } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  { wrapper: string; icon: string; iconPath: string }
> = {
  info: {
    wrapper: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-500',
    iconPath:
      'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  },
  success: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'text-emerald-500',
    iconPath:
      'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'text-amber-500',
    iconPath:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  },
  error: {
    wrapper: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
    iconPath:
      'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  },
};

export default function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  className = '',
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <div
      role="alert"
      className={[
        'flex gap-3 rounded-lg border px-4 py-3 text-sm',
        config.wrapper,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`mt-0.5 h-4 w-4 shrink-0 ${config.icon}`}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={config.iconPath} />
      </svg>

      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="ml-auto -mr-1 self-start rounded p-1 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
