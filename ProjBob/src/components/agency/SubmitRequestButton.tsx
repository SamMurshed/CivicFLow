'use client';

/**
 * SubmitRequestButton — submits a draft or awaiting-correction request.
 */

import { useActionState } from 'react';
import { Button, Alert } from '@/components/ui';
import { submitRequest, INITIAL_STATE } from '@/lib/procurement-request-actions';

interface Props {
  requestId: string;
  disabled?: boolean;
  disabledReason?: string;
}

export default function SubmitRequestButton({ requestId, disabled, disabledReason }: Props) {
  const [state, formAction, isPending] = useActionState(submitRequest, INITIAL_STATE);

  return (
    <div className="space-y-2">
      {state.error && (
        <Alert variant="error" title="Cannot submit">
          {state.error}
        </Alert>
      )}
      <form action={formAction}>
        <input type="hidden" name="request_id" value={requestId} />
        <Button
          type="submit"
          loading={isPending}
          disabled={isPending || disabled}
          title={disabledReason}
        >
          Submit for Review
        </Button>
      </form>
      {disabled && disabledReason && (
        <p className="text-xs text-amber-700">{disabledReason}</p>
      )}
    </div>
  );
}
