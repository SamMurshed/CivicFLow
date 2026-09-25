'use client';

/**
 * CommentForm — post a comment on a request.
 */

import { useActionState } from 'react';
import { Button, Alert } from '@/components/ui';
import { postComment, INITIAL_STATE } from '@/lib/review-actions';

interface Props {
  requestId: string;
  allowInternal?: boolean;
  placeholder?: string;
}

export default function CommentForm({
  requestId,
  allowInternal = false,
  placeholder = 'Add a comment…',
}: Props) {
  const [state, formAction, isPending] = useActionState(postComment, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="request_id" value={requestId} />

      {state.success && (
        <Alert variant="success" title="Comment posted">
          Your comment has been added.
        </Alert>
      )}
      {state.error && (
        <Alert variant="error" title="Error">
          {state.error}
        </Alert>
      )}

      <div className="flex flex-col gap-1">
        <textarea
          name="body"
          rows={3}
          required
          placeholder={placeholder}
          key={state.success ? 'reset' : 'input'}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {state.fieldErrors?.body && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {state.fieldErrors.body}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {allowInternal && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              name="is_internal"
              value="true"
              className="rounded border-slate-300"
            />
            Internal note (analyst-only)
          </label>
        )}
        <div className="ml-auto">
          <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
            Post Comment
          </Button>
        </div>
      </div>
    </form>
  );
}
