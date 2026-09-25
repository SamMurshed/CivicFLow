'use client';

import { useActionState } from 'react';
import { Alert, Button } from '@/components/ui';
import { INITIAL_STATE, updateChecklistItem } from '@/lib/review-actions';
import type { ChecklistItemStatus } from '@/types/database';

interface Props {
  requestId: string;
  itemId: string;
  currentStatus: ChecklistItemStatus;
  currentNote: string | null;
}

export default function ChecklistReviewForm({
  requestId,
  itemId,
  currentStatus,
  currentNote,
}: Props) {
  const [state, action, pending] = useActionState(updateChecklistItem, INITIAL_STATE);
  return (
    <form action={action} className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="item_id" value={itemId} />
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <p className="text-xs font-medium text-emerald-700">Checklist saved.</p>}
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Status
          <select
            name="status"
            defaultValue={currentStatus}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="satisfied">Satisfied</option>
            <option value="flagged">Flagged</option>
            <option value="waived">Waived</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Analyst note
          <input
            name="note"
            defaultValue={currentNote ?? ''}
            placeholder="Required when flagged"
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          />
        </label>
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
