'use client';

/**
 * VendorStatusForm — admin form to activate or deactivate a vendor.
 */

import { useActionState } from 'react';
import { Button, Alert } from '@/components/ui';
import { updateVendorStatus, INITIAL_STATE } from '@/lib/vendor-profile-actions';

interface Props {
  organizationId: string;
  organizationName: string;
  isActive: boolean;
}

export default function VendorStatusForm({ organizationId, organizationName, isActive }: Props) {
  const [state, formAction, isPending] = useActionState(updateVendorStatus, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organization_id" value={organizationId} />
      <input type="hidden" name="is_active" value={(!isActive).toString()} />

      {state.success && (
        <Alert variant="success" title="Status updated">
          {organizationName} has been {isActive ? 'deactivated' : 'activated'}.
        </Alert>
      )}
      {state.error && (
        <Alert variant="error" title="Failed to update status">
          {state.error}
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant={isActive ? 'danger' : 'primary'}
          size="sm"
          loading={isPending}
          disabled={isPending}
        >
          {isActive ? 'Deactivate vendor' : 'Activate vendor'}
        </Button>
        <span className="text-xs text-slate-500">
          Current status: <strong>{isActive ? 'Active' : 'Inactive'}</strong>
        </span>
      </div>
    </form>
  );
}
