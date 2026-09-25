/**
 * Vendor Profile — Zod validation schemas.
 *
 * ⚠️  FICTIONAL DATA NOTICE
 * All fields in this schema represent fictional, demonstration-only data.
 * This information is NOT verified by the City of New York or any
 * government authority. CivicFlow is a prototype application; no real
 * vendor, legal, or procurement data should ever be entered here.
 */

import { z } from 'zod';

// ─── Business category options (fictional) ────────────────────────────────────

export const BUSINESS_CATEGORIES = [
  'Information Technology',
  'Professional Services',
  'Construction & Engineering',
  'Office Supplies & Furniture',
  'Healthcare & Medical Supplies',
  'Food & Beverage',
  'Facilities Management',
  'Transportation & Logistics',
  'Environmental Services',
  'Marketing & Communications',
  'Legal Services',
  'Financial Services',
  'Educational Services',
  'Security Services',
  'Other',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

// ─── M/WBE self-identification options ───────────────────────────────────────

export const MWBE_DESIGNATIONS = [
  'None',
  'Minority-Owned Business Enterprise (MBE)',
  'Women-Owned Business Enterprise (WBE)',
  'Minority and Women-Owned Business Enterprise (M/WBE)',
  'Disadvantaged Business Enterprise (DBE)',
  'Service-Disabled Veteran-Owned Small Business (SDVOSB)',
] as const;

export type MWBEDesignation = (typeof MWBE_DESIGNATIONS)[number];

// ─── Shared field rules ────────────────────────────────────────────────────────

const nonEmptyString = (label: string) => z.string().trim().min(1, `${label} is required.`);

const optionalString = z.string().trim().optional();

// ─── Vendor organisation profile schema ───────────────────────────────────────

export const vendorOrgProfileSchema = z.object({
  /** Registered legal name of the business */
  legal_name: nonEmptyString('Legal name').max(200, 'Legal name must be 200 characters or fewer.'),

  /** Display name shown to agency users and analysts */
  display_name: nonEmptyString('Display name').max(
    100,
    'Display name must be 100 characters or fewer.',
  ),

  /** Street address line 1 */
  address_line1: nonEmptyString('Address line 1').max(
    200,
    'Address line 1 must be 200 characters or fewer.',
  ),

  /** Street address line 2 (optional) */
  address_line2: optionalString.pipe(
    z.string().max(200, 'Address line 2 must be 200 characters or fewer.').optional(),
  ),

  /** City */
  city: nonEmptyString('City').max(100, 'City must be 100 characters or fewer.'),

  /** State abbreviation */
  state: nonEmptyString('State').max(50, 'State must be 50 characters or fewer.'),

  /** ZIP / postal code */
  zip_code: nonEmptyString('ZIP code').regex(
    /^\d{5}(-\d{4})?$/,
    'ZIP code must be in format 12345 or 12345-6789.',
  ),

  /** Name of the primary contact person */
  contact_person: nonEmptyString('Contact person').max(
    100,
    'Contact person name must be 100 characters or fewer.',
  ),

  /** Contact email */
  contact_email: nonEmptyString('Contact email').email(
    'Contact email must be a valid email address.',
  ),

  /** Contact phone (North American format or international) */
  contact_phone: nonEmptyString('Contact phone').regex(
    /^[+]?[\d\s\-().]{7,20}$/,
    'Contact phone must be a valid phone number (7–20 digits, may include +, -, spaces, and parentheses).',
  ),

  /** Primary business category */
  primary_category: z.enum(BUSINESS_CATEGORIES),

  /** Whether the organisation is a registered nonprofit */
  is_nonprofit: z.boolean().default(false),

  /** M/WBE self-identification (unverified) */
  mwbe_designation: z.enum(MWBE_DESIGNATIONS).default('None'),

  /** Optional short description */
  description: optionalString.pipe(
    z.string().max(500, 'Description must be 500 characters or fewer.').optional(),
  ),
});

export type VendorOrgProfileInput = z.infer<typeof vendorOrgProfileSchema>;

// ─── Admin status update schema ───────────────────────────────────────────────

export const vendorStatusSchema = z.object({
  organization_id: z.string().uuid('Invalid organisation ID.'),
  is_active: z.boolean(),
  reason: z.string().trim().max(500, 'Reason must be 500 characters or fewer.').optional(),
});

export type VendorStatusInput = z.infer<typeof vendorStatusSchema>;
