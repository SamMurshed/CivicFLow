'use client';

import { useActionState } from 'react';
import { Alert, Button } from '@/components/ui';
import { INITIAL_STATE, submitFeedback } from '@/lib/support-actions';

export default function FeedbackForm({ articleId }: { articleId: string }) {
  const [state, action, pending] = useActionState(submitFeedback, INITIAL_STATE);
  return (
    <form action={action} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
      <input type="hidden" name="article_id" value={articleId} />
      {state.success && <Alert variant="success">Thank you. Your feedback was recorded.</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
        <label className="text-xs font-medium text-slate-600">
          Helpful?
          <select
            name="rating"
            defaultValue="5"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="5">5 — Very</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1 — Not yet</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Optional comment
          <input
            name="comment"
            maxLength={1000}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="What could be clearer?"
          />
        </label>
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          Send
        </Button>
      </div>
    </form>
  );
}
