'use client';

import { useActionState } from 'react';
import { Alert, Button } from '@/components/ui';
import { INITIAL_STATE, startReview } from '@/lib/review-actions';

export default function StartReviewButton({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(startReview, INITIAL_STATE);
  return (
    <div className="space-y-2">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <form action={action}>
        <input type="hidden" name="request_id" value={requestId} />
        <Button type="submit" fullWidth loading={pending} disabled={pending}>
          Start Review
        </Button>
      </form>
    </div>
  );
}
