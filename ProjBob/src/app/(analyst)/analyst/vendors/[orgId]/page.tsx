import { requireRole } from '@/lib/auth/dal';
import { getVendorOrgProfile } from '@/db/vendor-profile';
import { calcProfileCompleteness } from '@/lib/vendor-profile-completeness';
import ProfileCompletenessCard from '@/components/vendor/ProfileCompletenessCard';
import { Card, CardHeader, CardSection, Alert } from '@/components/ui';
import Badge from '@/components/ui/Badge';

interface Props {
  params: Promise<{ orgId: string }>;
}

/**
 * Analyst read-only view of a vendor organisation profile.
 *
 * Analysts may view but not edit vendor profiles.
 *
 * ⚠️  FICTIONAL DATA NOTICE
 * All data displayed here is fictional and for demonstration only.
 * It is NOT verified by the City of New York or any government authority.
 */
export default async function AnalystVendorProfilePage({ params }: Props) {
  await requireRole('analyst');

  const { orgId } = await params;
  const result = await getVendorOrgProfile(orgId);

  if (!result) {
    return (
      <Alert variant="warning" title="Not found">
        Vendor organisation not found or you do not have access.
      </Alert>
    );
  }

  const { organization: org, vendorProfile: vp } = result;
  const completeness = calcProfileCompleteness(vp);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{org.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">Vendor Organisation — Read Only</p>
        </div>
        <Badge variant={org.is_active ? 'green' : 'slate'}>
          {org.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Fictional data disclaimer */}
      <Alert variant="info" title="Fictional demonstration data">
        All information displayed here is fictional and created for demonstration purposes only.
        It has not been verified by the City of New York or any government authority.
      </Alert>

      {/* Completeness */}
      <ProfileCompletenessCard result={completeness} />

      {vp ? (
        <div className="space-y-4">
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

          <Card noPadding>
            <CardHeader title="Business Categories" />
            <CardSection>
              <dl className="grid grid-cols-1 gap-4">
                <ProfileField label="Primary Category" value={vp.primary_category} />
                {vp.description && (
                  <ProfileField label="Description" value={vp.description} />
                )}
              </dl>
            </CardSection>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500">This vendor has not yet set up their profile.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  );
}
