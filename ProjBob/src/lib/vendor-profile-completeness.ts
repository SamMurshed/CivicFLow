/**
 * Vendor profile completeness calculator.
 *
 * Returns a percentage (0–100) and the list of missing required fields so the
 * UI can guide vendors to finish their profile.
 */

import type { VendorOrgProfile } from '@/types/database';

export interface CompletenessResult {
  /** 0–100 integer percentage */
  percent: number;
  /** Human-readable labels for missing required fields */
  missingFields: string[];
  /** How many required fields are filled in */
  filled: number;
  /** Total number of required fields */
  total: number;
}

// Required fields and their display labels
const REQUIRED_FIELDS: Array<{ key: keyof VendorOrgProfile; label: string }> = [
  { key: 'legal_name', label: 'Legal Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'address_line1', label: 'Street Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip_code', label: 'ZIP Code' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'primary_category', label: 'Primary Business Category' },
];

/**
 * Calculates profile completeness from a (possibly partial) VendorOrgProfile.
 * Accepts `null` to handle the "no profile yet" case gracefully.
 */
export function calcProfileCompleteness(
  profile: Partial<VendorOrgProfile> | null | undefined,
): CompletenessResult {
  if (!profile) {
    return {
      percent: 0,
      missingFields: REQUIRED_FIELDS.map((f) => f.label),
      filled: 0,
      total: REQUIRED_FIELDS.length,
    };
  }

  const missingFields: string[] = [];
  let filled = 0;

  for (const { key, label } of REQUIRED_FIELDS) {
    const value = profile[key];
    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      filled++;
    } else {
      missingFields.push(label);
    }
  }

  const percent = Math.round((filled / REQUIRED_FIELDS.length) * 100);
  return { percent, missingFields, filled, total: REQUIRED_FIELDS.length };
}
