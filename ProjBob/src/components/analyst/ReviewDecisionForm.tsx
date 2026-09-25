'use client';

/**
 * ReviewDecisionForm — analyst submits a review decision (approve, reject,
 * request corrections, place on hold, resume from hold).
 */

import { useActionState } from 'react';
import { Button, Alert } from '@/components/ui';
import { recordReviewDecision, INITIAL_STATE } from '@/lib/review-actions';
import { ALLOWED_TRANSITIONS, REVIEW_DECISIONS } from '@/validation/procurement-request';
import type { RequestStatus } from '@/types/database';

interface Props {
  requestId: string;
  currentStatus: RequestStatus;
}

const DECISION_LABELS: Record<string, string> = {
  approve: 'Approve',
  reject: 'Reject',
  request_correction: 'Request Corrections',
  place_on_hold: 'Place on Hold',
  resume_from_hold: 'Resume from Hold',
};

export default function ReviewDecisionForm({ requestId, currentStatus }: Props) {
  const [state, formAction, isPending] = useActionState(recordReviewDecision, INITIAL_STATE);

  const allowedDecisions = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  if (allowedDecisions.length === 0) {
    return (
      <p className="text-xs text-slate-500">No actions available for the current status.</p>
    );
  }

  return (
    <div className="space-y-4">
      {state.success && (
        <Alert variant="success" title="Decision recorded">
          The request status has been updated.
        </Alert>
      )}
      {state.error && (
        <Alert variant="error" title="Error">
          {state.error}
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="request_id" value={requestId} />

        <div className="flex flex-col gap-1">
          <label htmlFor="decision" className="text-xs font-medium text-slate-600">
            Decision
          </label>
          <select
            name="decision"
            id="decision"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a decision…</option>
            {REVIEW_DECISIONS.filter((d) => allowedDecisions.includes(d)).map((d) => (
              <option key={d} value={d}>
                {DECISION_LABELS[d] ?? d}
              </option>
            ))}
          </select>
          {state.fieldErrors?.decision && (
            <p role="alert" className="text-xs text-red-600">
              {state.fieldErrors.decision}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="note" className="text-xs font-medium text-slate-600">
            Rationale / Note
            <span className="ml-1 text-slate-400">(required for approve, reject, corrections)</span>
          </label>
          <textarea
            name="note"
            id="note"
            rows={4}
            placeholder="Enter rationale or correction details…"
            className={[
              'block w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
              state.fieldErrors?.note ? 'border-red-400 bg-red-50' : 'border-slate-300',
            ].join(' ')}
          />
          {state.fieldErrors?.note && (
            <p role="alert" className="text-xs text-red-600">
              {state.fieldErrors.note}
            </p>
          )}
        </div>

        <Button type="submit" loading={isPending} disabled={isPending} fullWidth>
          Submit Decision
        </Button>
      </form>
    </div>
  );
}
