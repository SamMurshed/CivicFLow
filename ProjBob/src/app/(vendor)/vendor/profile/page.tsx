import { requireRole } from '@/lib/auth/dal';
import { getVendorOrgProfile } from '@/db/vendor-profile';
import { calcProfileCompleteness } from '@/lib/vendor-profile-completeness';
import ProfileCompletenessCard from '@/components/vendor/ProfileCompletenessCard';
import { Card, CardHeader, CardSection, Button, Alert } from '@/components/ui';
import Link from 'next/link';

/**
 * Vendor Profile — view page.
 *
 * ⚠️  FICTIONAL DATA NOTICE
 * All data displayed here is fictional and for demonstration only.
 * It is NOT verified by the City of New York or any government authority.
 */
export default async function VendorProfilePage() {
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
  const org = result?.organization ?? user.organization;
  const completeness = calcProfileCompleteness(vp);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Profile</h1>
          <p className="mt-0.5 text-sm text-slate-500">{org.name}</p>
        </div>
        <Link href="/vendor/profile/edit">
          <Button variant="primary" size="sm">
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Fictional data disclaimer */}
      <Alert variant="info" title="Fictional demonstration data">
        All information on this profile is fictional and created for demonstration purposes only. It
        has not been verified by the City of New York or any government authority.
      </Alert>

      {/* Profile completeness */}
      <ProfileCompletenessCard result={completeness} editHref="/vendor/profile/edit" />

      {vp ? (
        <div className="space-y-4">
          {/* Legal & Identity */}
          <Card noPadding>
            <CardHeader title="Legal &amp; Identity" />
            <CardSection>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileField label="Legal Name" value={vp.legal_name} />
                <ProfileField label="Display Name" value={vp.display_name} />
                <ProfileField
                  label="Nonprofit"
                  value={vp.is_nonprofit ? 'Yes — registered nonprofit' : 'No'}
                />
                <ProfileField label="M/WBE Self-Identification" value={vp.mwbe_designation} />
              </dl>
            </CardSection>
          </Card>

          {/* Address */}
          <Card noPadding>
            <CardHeader title="Business Address" />
            <CardSection>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileField label="Address Line 1" value={vp.address_line1} />
                {vp.address_line2 && (
                  <ProfileField label="Address Line 2" value={vp.address_line2} />
                )}
                <ProfileField label="City" value={vp.city} />
                <ProfileField label="State" value={vp.state} />
                <ProfileField label="ZIP Code" value={vp.zip_code} />
              </dl>
            </CardSection>
          </Card>

          {/* Contact */}
          <Card noPadding>
            <CardHeader title="Contact Information" />
            <CardSection>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileField label="Contact Person" value={vp.contact_person} />
                <ProfileField label="Contact Email" value={vp.contact_email} />
                <ProfileField label="Contact Phone" value={vp.contact_phone} />
              </dl>
            </CardSection>
          </Card>

          {/* Business categories */}
          <Card noPadding>
            <CardHeader title="Business Categories" />
            <CardSection>
              <dl className="grid grid-cols-1 gap-4">
                <ProfileField label="Primary Category" value={vp.primary_category} />
                {vp.description && <ProfileField label="Description" value={vp.description} />}
              </dl>
            </CardSection>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-700">Profile not yet set up</p>
            <p className="mt-1 text-xs text-slate-500">
              Complete your profile so agency users and analysts can learn about your organisation.
            </p>
            <Link href="/vendor/profile/edit" className="mt-4 inline-block">
              <Button variant="primary" size="sm">
                Set up profile
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  );
}
