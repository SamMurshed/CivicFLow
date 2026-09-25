/**
 * StatusBadge — displays a procurement request status as a coloured chip.
 *
 * Covers all RequestStatus values from the database schema.
 */

import type { RequestStatus } from '@/types/database';

interface StatusBadgeProps {
  status: RequestStatus;
  /** Show a leading indicator dot */
  dot?: boolean;
}

interface StatusConfig {
  label: string;
  classes: string;
  dotClass: string;
}

const STATUS_CONFIG: Record<RequestStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    classes: 'bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
  },
  submitted: {
    label: 'Submitted',
    classes: 'bg-blue-100 text-blue-700',
    dotClass: 'bg-blue-500',
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-violet-100 text-violet-700',
    dotClass: 'bg-violet-500',
  },
  awaiting_correction: {
    label: 'Awaiting Correction',
    classes: 'bg-amber-100 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  correction_submitted: {
    label: 'Correction Submitted',
    classes: 'bg-cyan-100 text-cyan-700',
    dotClass: 'bg-cyan-500',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-emerald-100 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-700',
    dotClass: 'bg-red-500',
  },
  withdrawn: {
    label: 'Withdrawn',
    classes: 'bg-slate-100 text-slate-500',
    dotClass: 'bg-slate-400',
  },
  on_hold: {
    label: 'On Hold',
    classes: 'bg-purple-100 text-purple-700',
    dotClass: 'bg-purple-500',
  },
};

export default function StatusBadge({ status, dot = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.classes,
      ].join(' ')}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

/**
 * Get the human-readable label for a status.
 */
export function getStatusLabel(status: RequestStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}
