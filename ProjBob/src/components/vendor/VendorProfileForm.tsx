'use client';

/**
 * VendorProfileForm — client form component for editing the vendor profile.
 *
 * Uses useActionState (React 19) to handle server action state.
 *
 * ⚠️  FICTIONAL DATA NOTICE
 * All fields collect fictional, demonstration-only data. This information is
 * NOT verified by the City of New York or any government authority.
 */

import { useActionState } from 'react';
import { Input, Select, Textarea, Button, FormErrorSummary, Alert } from '@/components/ui';
import { BUSINESS_CATEGORIES, MWBE_DESIGNATIONS } from '@/validation/vendor-profile';
import type { VendorOrgProfile } from '@/types/database';
import { updateVendorProfile, INITIAL_STATE } from '@/lib/vendor-profile-actions';

interface Props {
  defaultValues: Partial<VendorOrgProfile>;
}

export default function VendorProfileForm({ defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState(updateVendorProfile, INITIAL_STATE);

  const fe = state.fieldErrors;

  return (
    <form action={formAction} noValidate className="space-y-6">
      {/* Global error / success */}
      {state.error && !Object.keys(fe).length && (
        <Alert variant="error" title="Could not save profile">
          {state.error}
        </Alert>
      )}
      {state.error && Object.keys(fe).length > 0 && <FormErrorSummary errors={fe} />}

      {/* Legal & Identity */}
      <fieldset>
        <legend className="mb-4 text-sm font-semibold text-slate-900">Legal &amp; Identity</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Legal Name"
            name="legal_name"
            id="legal_name"
            required
            autoComplete="organization"
            defaultValue={defaultValues.legal_name ?? ''}
            error={fe.legal_name}
          />
          <Input
            label="Display Name"
            name="display_name"
            id="display_name"
            required
            defaultValue={defaultValues.display_name ?? ''}
            error={fe.display_name}
            description="Name shown to agency users and analysts"
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Registered Nonprofit
            </label>
            <Select
              label="Registered Nonprofit"
              srOnlyLabel
              name="is_nonprofit"
              id="is_nonprofit"
              defaultValue={defaultValues.is_nonprofit ? 'true' : 'false'}
              options={[
                { value: 'false', label: 'No' },
                { value: 'true', label: 'Yes — registered nonprofit' },
              ]}
              error={fe.is_nonprofit}
            />
          </div>
          <Select
            label="M/WBE Self-Identification"
            name="mwbe_designation"
            id="mwbe_designation"
            defaultValue={defaultValues.mwbe_designation ?? 'None'}
            options={MWBE_DESIGNATIONS.map((d) => ({ value: d, label: d }))}
            description="Unverified self-identification for demonstration only"
            error={fe.mwbe_designation}
          />
        </div>
      </fieldset>

      {/* Address */}
      <fieldset>
        <legend className="mb-4 text-sm font-semibold text-slate-900">Business Address</legend>
        <div className="space-y-4">
          <Input
            label="Address Line 1"
            name="address_line1"
            id="address_line1"
            required
            autoComplete="address-line1"
            defaultValue={defaultValues.address_line1 ?? ''}
            error={fe.address_line1}
          />
          <Input
            label="Address Line 2"
            name="address_line2"
            id="address_line2"
            autoComplete="address-line2"
            defaultValue={defaultValues.address_line2 ?? ''}
            error={fe.address_line2}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="City"
              name="city"
              id="city"
              required
              autoComplete="address-level2"
              defaultValue={defaultValues.city ?? ''}
              error={fe.city}
            />
            <Input
              label="State"
              name="state"
              id="state"
              required
              autoComplete="address-level1"
              defaultValue={defaultValues.state ?? ''}
              error={fe.state}
            />
            <Input
              label="ZIP Code"
              name="zip_code"
              id="zip_code"
              required
              autoComplete="postal-code"
              defaultValue={defaultValues.zip_code ?? ''}
              error={fe.zip_code}
            />
          </div>
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset>
        <legend className="mb-4 text-sm font-semibold text-slate-900">Contact Information</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Contact Person"
            name="contact_person"
            id="contact_person"
            required
            defaultValue={defaultValues.contact_person ?? ''}
            error={fe.contact_person}
          />
          <Input
            label="Contact Email"
            name="contact_email"
            id="contact_email"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultValues.contact_email ?? ''}
            error={fe.contact_email}
          />
          <Input
            label="Contact Phone"
            name="contact_phone"
            id="contact_phone"
            type="tel"
            required
            autoComplete="tel"
            defaultValue={defaultValues.contact_phone ?? ''}
            error={fe.contact_phone}
          />
        </div>
      </fieldset>

      {/* Business categories */}
      <fieldset>
        <legend className="mb-4 text-sm font-semibold text-slate-900">Business Categories</legend>
        <div className="space-y-4">
          <Select
            label="Primary Business Category"
            name="primary_category"
            id="primary_category"
            required
            defaultValue={defaultValues.primary_category ?? ''}
            placeholder="Select a category"
            options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={fe.primary_category}
          />
          <Textarea
            label="Description"
            name="description"
            id="description"
            rows={3}
            defaultValue={defaultValues.description ?? ''}
            error={fe.description}
            description="Optional — up to 500 characters"
          />
        </div>
      </fieldset>

      {/* Fictional data reminder */}
      <p className="text-xs text-slate-500">
        <strong>Note:</strong> All information entered here is fictional and for demonstration
        purposes only. It will not be verified by the City of New York or any government authority.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <a
          href="/vendor/profile"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          Cancel
        </a>
        <Button type="submit" variant="primary" loading={isPending} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}
