/**
 * Vendor Profile — database queries and mutations.
 *
 * Reads and writes the vendor organisation profile.  The extended profile
 * fields (legal name, address, contact, M/WBE, etc.) are stored as JSON in
 * the `metadata` column of the `organizations` table so that no schema
 * migration is required for this fictional demonstration workflow.
 *
 * ⚠️  FICTIONAL DATA NOTICE: All data handled here is for demonstration only
 * and is NOT verified by the City of New York or any government authority.
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Organization, VendorOrgProfile } from '@/types/database';

// ─── Result shapes ────────────────────────────────────────────────────────────

export interface VendorProfileResult {
  organization: Organization;
  vendorProfile: VendorOrgProfile | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Loads the organisation row and extracts the `VendorOrgProfile` from its
 * `metadata` column.  Returns `null` if the organisation doesn't exist.
 *
 * Only call this for `kind = 'vendor'` organisations.
 */
export async function getVendorOrgProfile(
  organizationId: string,
): Promise<VendorProfileResult | null> {
  const supabase = await createClient();

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .eq('kind', 'vendor')
    .single();

  if (error || !org) {
    return null;
  }

  // Metadata is stored as a JSON object — extract and cast the vendor profile
  // sub-object safely.
  const metadata = (org as Organization & { metadata?: unknown }).metadata;
  const vendorProfile =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as VendorOrgProfile)
      : null;

  return { organization: org, vendorProfile };
}

/**
 * Loads a vendor organisation profile by organisation ID and verifies that
 * the requesting profile belongs to the same organisation.
 * Returns `null` when not found or access would be cross-organisation.
 */
export async function getVendorOrgProfileSecure(
  requestingUserId: string,
  organizationId: string,
): Promise<VendorProfileResult | null> {
  const supabase = await createClient();

  // Confirm the requesting user belongs to this organisation
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', requestingUserId)
    .single();

  if (!profile) return null;

  // Vendors must be in the same org; analysts/admins may view any vendor org
  const role = (profile as { organization_id: string | null; role: string }).role;
  if (role === 'vendor' && profile.organization_id !== organizationId) {
    return null;
  }

  return getVendorOrgProfile(organizationId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Persists the vendor organisation profile into the `metadata` column of the
 * `organizations` row identified by `organizationId`.
 *
 * The caller is responsible for authorisation checks before calling this.
 */
export async function upsertVendorOrgProfile(
  organizationId: string,
  input: VendorOrgProfile,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const profileData: VendorOrgProfile = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // Also sync display_name back to the organisations.name field
  // Cast to unknown first to allow the metadata column that exists in Supabase
  // but is not in the manually maintained generated type.
  const updatePayload = {
    name: input.display_name,
    metadata: profileData,
  } as unknown as Parameters<ReturnType<typeof supabase.from>['update']>[0];

  const { error } = await supabase
    .from('organizations')
    .update(updatePayload)
    .eq('id', organizationId)
    .eq('kind', 'vendor');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Updates the `is_active` flag of a vendor organisation (admin only).
 */
export async function setVendorOrgActive(
  organizationId: string,
  isActive: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organizations')
    .update({ is_active: isActive })
    .eq('id', organizationId)
    .eq('kind', 'vendor');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
