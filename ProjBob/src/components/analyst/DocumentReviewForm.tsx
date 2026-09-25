'use client';

import { useActionState } from 'react';
import { Alert, Button } from '@/components/ui';
import { INITIAL_STATE, reviewDocument } from '@/lib/review-actions';
import type { DocumentStatus } from '@/types/database';

interface Props {
  requestId: string;
  documentId: string;
  currentStatus: DocumentStatus;
  currentNote: string | null;
}

export default function DocumentReviewForm({
  requestId,
  documentId,
  currentStatus,
  currentNote,
}: Props) {
  const [state, action, pending] = useActionState(reviewDocument, INITIAL_STATE);
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="document_id" value={documentId} />
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <p className="text-xs font-medium text-emerald-700">Review saved.</p>}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Decision
          <select
            name="status"
            defaultValue={currentStatus === 'rejected' ? 'rejected' : 'accepted'}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
          >
            <option value="accepted">Accept</option>
            <option value="rejected">Reject</option>
          </select>
        </label>
        <label className="min-w-48 flex-1 text-xs font-medium text-slate-600">
          Note
          <input
            name="note"
            defaultValue={currentNote ?? ''}
            placeholder="Required when rejected"
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
          />
        </label>
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
