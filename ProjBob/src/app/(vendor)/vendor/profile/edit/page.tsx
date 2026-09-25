import { requireRole } from '@/lib/auth/dal';
import { getVendorOrgProfile } from '@/db/vendor-profile';
import { calcProfileCompleteness } from '@/lib/vendor-profile-completeness';
import ProfileCompletenessCard from '@/components/vendor/ProfileCompletenessCard';
import VendorProfileForm from '@/components/vendor/VendorProfileForm';
import { Alert } from '@/components/ui';

/**
 * Vendor Profile — edit page (vendor only).
 *
 * ⚠️  FICTIONAL DATA NOTICE
 * All fields on this page collect fictional, demonstration-only data.
 * This information is NOT verified by the City of New York or any government
 * authority.
 */
export default async function VendorProfileEditPage() {
  const user = await requireRole('vendor');

  if (!user.organization || user.organization.kind !== 'vendor') {
    return (
      <Alert variant="warning" title="No organisation linked">
        Your account is not linked to a vendor organisation. Please contact support.
      </Alert>
    );
  }

  const result = await getVendorOrgProfile(user.organization.id);
  const vp = result?.vendorProfile ?? null;
  const completeness = calcProfileCompleteness(vp);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Edit Vendor Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500">{user.organization.name}</p>
      </div>

      {/* Fictional data disclaimer */}
      <Alert variant="info" title="Fictional demonstration data">
        All information on this page is fictional and created for demonstration purposes only. It is
        NOT verified by the City of New York or any government authority.
      </Alert>

      {/* Profile completeness */}
      <ProfileCompletenessCard result={completeness} />

      {/* Edit form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <VendorProfileForm defaultValues={vp ?? {}} />
      </div>
    </div>
  );
}
