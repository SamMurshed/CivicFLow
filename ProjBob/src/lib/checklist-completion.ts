/**
 * Checklist completion utility.
 *
 * Pure function — no DB or server-only imports.
 * Can be used from both server and client contexts (e.g. tests).
 */

import type { RequestChecklistItem } from '@/types/database';

export interface ChecklistCompletion {
  total: number;
  satisfied: number;
  required: number;
  requiredSatisfied: number;
  allRequiredMet: boolean;
}

/**
 * Calculates completion stats for a set of checklist items.
 * Items with status 'satisfied' or 'waived' count as met.
 */
export function calcChecklistCompletion(items: RequestChecklistItem[]): ChecklistCompletion {
  const total = items.length;
  const satisfied = items.filter((i) => i.status === 'satisfied' || i.status === 'waived').length;
  const required = items.filter((i) => i.is_required).length;
  const requiredSatisfied = items.filter(
    (i) => i.is_required && (i.status === 'satisfied' || i.status === 'waived'),
  ).length;
  return {
    total,
    satisfied,
    required,
    requiredSatisfied,
    allRequiredMet: required === 0 || requiredSatisfied >= required,
  };
}
