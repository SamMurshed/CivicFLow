'use server';

/**
 * Vendor Profile — Server Actions
 *
 * updateVendorProfile   — vendors save their own organisation profile
 * updateVendorStatus    — admins activate / deactivate a vendor organisation
 *
 * ⚠️  FICTIONAL DATA NOTICE: All data handled here is for demonstration only
 * and is NOT verified by the City of New York or any government authority.
 */

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import {
  getVendorOrgProfile,
  upsertVendorOrgProfile,
  setVendorOrgActive,
} from '@/db/vendor-profile';
import { vendorOrgProfileSchema, vendorStatusSchema } from '@/validation/vendor-profile';
import { logEvent } from '@/lib/activity-log';
import type { VendorOrgProfile } from '@/types/database';

// ─── Shared state shape ───────────────────────────────────────────────────────

export interface ActionState {
  success: boolean;
  error: string | null;
  /** Field-level Zod errors keyed by field name */
  fieldErrors: Record<string, string | undefined>;
}

const INITIAL_STATE: ActionState = { success: false, error: null, fieldErrors: {} };

// ─── updateVendorProfile ──────────────────────────────────────────────────────

/**
 * Saves the vendor organisation profile for the signed-in vendor.
 * Vendors can only update their own organisation.  Analysts may view but
 * cannot call this action.  Admins do not use this action (they use
 * updateVendorStatus instead).
 */
export async function updateVendorProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Only vendors may update their profile
  const user = await requireRole('vendor');

  if (!user.organization || user.organization.kind !== 'vendor') {
    return {
      success: false,
      error: 'Your account is not associated with a vendor organisation.',
      fieldErrors: {},
    };
  }

  const orgId = user.organization.id;

  // Parse raw FormData into a plain object
  const raw = {
    legal_name: formData.get('legal_name'),
    display_name: formData.get('display_name'),
    address_line1: formData.get('address_line1'),
    address_line2: formData.get('address_line2') || undefined,
    city: formData.get('city'),
    state: formData.get('state'),
    zip_code: formData.get('zip_code'),
    contact_person: formData.get('contact_person'),
    contact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone'),
    primary_category: formData.get('primary_category'),
    is_nonprofit: formData.get('is_nonprofit') === 'true',
    mwbe_designation: formData.get('mwbe_designation') || 'None',
    description: formData.get('description') || undefined,
  };

  // Validate with Zod
  const parsed = vendorOrgProfileSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, error: 'Please correct the errors below.', fieldErrors };
  }

  const profileData: VendorOrgProfile = {
    ...parsed.data,
    address_line2: parsed.data.address_line2 ?? undefined,
    description: parsed.data.description ?? undefined,
  };

  const result = await upsertVendorOrgProfile(orgId, profileData);

  if (!result.success) {
    return { success: false, error: 'Failed to save profile. Please try again.', fieldErrors: {} };
  }

  // Log the update — event type only, no before/after field values
  await logEvent({
    actor_id: user.id,
    event_type: 'vendor_profile.updated',
    entity_type: 'organization',
    entity_id: orgId,
    metadata: { org_id: orgId },
  });

  redirect('/vendor/profile');
}

// ─── updateVendorStatus ───────────────────────────────────────────────────────

/**
 * Activates or deactivates a vendor organisation.  Admin only.
 */
export async function updateVendorStatus(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('admin');

  const raw = {
    organization_id: formData.get('organization_id'),
    is_active: formData.get('is_active') === 'true',
    reason: formData.get('reason') || undefined,
  };

  const parsed = vendorStatusSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: 'Invalid request.', fieldErrors };
  }

  // Verify the org exists and is a vendor org
  const existing = await getVendorOrgProfile(parsed.data.organization_id);
  if (!existing) {
    return {
      success: false,
      error: 'Vendor organisation not found.',
      fieldErrors: {},
    };
  }

  const result = await setVendorOrgActive(parsed.data.organization_id, parsed.data.is_active);

  if (!result.success) {
    return {
      success: false,
      error: 'Failed to update vendor status. Please try again.',
      fieldErrors: {},
    };
  }

  await logEvent({
    actor_id: user.id,
    event_type: parsed.data.is_active ? 'vendor.activated' : 'vendor.deactivated',
    entity_type: 'organization',
    entity_id: parsed.data.organization_id,
    metadata: {
      org_id: parsed.data.organization_id,
      // reason is recorded as a non-sensitive metadata key (no field values)
      has_reason: Boolean(parsed.data.reason),
    },
  });

  return { success: true, error: null, fieldErrors: {} };
}

export { INITIAL_STATE };
