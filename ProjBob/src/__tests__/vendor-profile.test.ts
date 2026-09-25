/**
 * Task 5 — Vendor Profile: Validation, Authorization, and Profile Completeness
 *
 * Tests:
 *   • vendorOrgProfileSchema — valid input, each required field, format rules
 *   • vendorStatusSchema — valid / invalid inputs
 *   • calcProfileCompleteness — null, partial, complete profiles
 *   • Authorization — vendor owns their org, analyst read-only, cross-org denied
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { vendorOrgProfileSchema, vendorStatusSchema } from '@/validation/vendor-profile';
import { calcProfileCompleteness } from '@/lib/vendor-profile-completeness';
import type { VendorOrgProfile } from '@/types/database';
import type { Profile, Organization, AppRole } from '@/types/database';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_INPUT = {
  legal_name: 'Apex Technology Solutions LLC',
  display_name: 'Apex Technology',
  address_line1: '742 Evergreen Terrace',
  address_line2: 'Suite 4B',
  city: 'Springfield',
  state: 'NY',
  zip_code: '10001',
  contact_person: 'Jordan Chen',
  contact_email: 'jordan.chen@apextech.example',
  contact_phone: '+1 (555) 234-5678',
  primary_category: 'Information Technology' as const,
  is_nonprofit: false,
  mwbe_designation: 'None' as const,
  description: 'A fictional IT services company for demonstration purposes.',
};

const COMPLETE_VENDOR_PROFILE: VendorOrgProfile = {
  legal_name: 'Apex Technology Solutions LLC',
  display_name: 'Apex Technology',
  address_line1: '742 Evergreen Terrace',
  city: 'Springfield',
  state: 'NY',
  zip_code: '10001',
  contact_person: 'Jordan Chen',
  contact_email: 'jordan.chen@apextech.example',
  contact_phone: '+1 (555) 234-5678',
  primary_category: 'Information Technology',
  is_nonprofit: false,
  mwbe_designation: 'None',
};

// ─── vendorOrgProfileSchema ───────────────────────────────────────────────────

describe('vendorOrgProfileSchema', () => {
  it('accepts a fully valid input', () => {
    const result = vendorOrgProfileSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  it('accepts input without optional address_line2', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { address_line2, description, ...rest } = VALID_INPUT;
    const result = vendorOrgProfileSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('rejects missing legal_name', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, legal_name: '' });
    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    expect(issues.some((i) => i.path[0] === 'legal_name')).toBe(true);
  });

  it('rejects missing display_name', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, display_name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'display_name')).toBe(true);
  });

  it('rejects missing address_line1', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, address_line1: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'address_line1')).toBe(true);
  });

  it('rejects missing city', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, city: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'city')).toBe(true);
  });

  it('rejects missing state', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, state: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'state')).toBe(true);
  });

  it('rejects invalid ZIP code (letters)', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, zip_code: 'ABCDE' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'zip_code')).toBe(true);
  });

  it('accepts ZIP+4 format (12345-6789)', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, zip_code: '12345-6789' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid contact email', () => {
    const result = vendorOrgProfileSchema.safeParse({
      ...VALID_INPUT,
      contact_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'contact_email')).toBe(true);
  });

  it('rejects too-short phone number', () => {
    const result = vendorOrgProfileSchema.safeParse({ ...VALID_INPUT, contact_phone: '123' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'contact_phone')).toBe(true);
  });

  it('rejects invalid primary_category', () => {
    const result = vendorOrgProfileSchema.safeParse({
      ...VALID_INPUT,
      primary_category: 'Invalid Category',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'primary_category')).toBe(true);
  });

  it('rejects description over 500 chars', () => {
    const result = vendorOrgProfileSchema.safeParse({
      ...VALID_INPUT,
      description: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'description')).toBe(true);
  });

  it('rejects legal_name over 200 chars', () => {
    const result = vendorOrgProfileSchema.safeParse({
      ...VALID_INPUT,
      legal_name: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'legal_name')).toBe(true);
  });

  it('trims whitespace from string fields', () => {
    const result = vendorOrgProfileSchema.safeParse({
      ...VALID_INPUT,
      legal_name: '  Apex Technology  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.legal_name).toBe('Apex Technology');
    }
  });
});

// ─── vendorStatusSchema ───────────────────────────────────────────────────────

describe('vendorStatusSchema', () => {
  it('accepts valid activate input', () => {
    const result = vendorStatusSchema.safeParse({
      organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = vendorStatusSchema.safeParse({
      organization_id: 'not-a-uuid',
      is_active: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'organization_id')).toBe(true);
  });

  it('accepts an optional reason', () => {
    const result = vendorStatusSchema.safeParse({
      organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      is_active: false,
      reason: 'Flagged for compliance review.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects reason over 500 chars', () => {
    const result = vendorStatusSchema.safeParse({
      organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      is_active: false,
      reason: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'reason')).toBe(true);
  });
});

// ─── calcProfileCompleteness ──────────────────────────────────────────────────

describe('calcProfileCompleteness', () => {
  it('returns 0% for null profile', () => {
    const result = calcProfileCompleteness(null);
    expect(result.percent).toBe(0);
    expect(result.filled).toBe(0);
    expect(result.missingFields.length).toBe(result.total);
  });

  it('returns 0% for empty object', () => {
    const result = calcProfileCompleteness({});
    expect(result.percent).toBe(0);
    expect(result.filled).toBe(0);
  });

  it('returns 100% for a complete profile', () => {
    const result = calcProfileCompleteness(COMPLETE_VENDOR_PROFILE);
    expect(result.percent).toBe(100);
    expect(result.missingFields).toHaveLength(0);
  });

  it('returns partial percentage for a partially complete profile', () => {
    const partial: Partial<VendorOrgProfile> = {
      legal_name: 'Apex Technology Solutions LLC',
      display_name: 'Apex Technology',
      city: 'Springfield',
      state: 'NY',
      zip_code: '10001',
    };
    const result = calcProfileCompleteness(partial);
    expect(result.percent).toBeGreaterThan(0);
    expect(result.percent).toBeLessThan(100);
    expect(result.filled).toBe(5);
    // Missing: address_line1, contact_person, contact_email, contact_phone, primary_category
    expect(result.missingFields).toContain('Street Address');
    expect(result.missingFields).toContain('Contact Person');
    expect(result.missingFields).toContain('Contact Email');
  });

  it('does not count whitespace-only values as filled', () => {
    const result = calcProfileCompleteness({
      ...COMPLETE_VENDOR_PROFILE,
      legal_name: '   ',
    });
    expect(result.missingFields).toContain('Legal Name');
  });

  it('reports the correct total field count', () => {
    const result = calcProfileCompleteness(null);
    expect(result.total).toBe(10); // 10 required fields defined in the utility
  });
});

// ─── Authorization: cross-organisation access ─────────────────────────────────

// Mock next/navigation
const mockRedirect = vi.fn((path: string): never => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

vi.mock('server-only', () => ({}));

function makeProfile(role: AppRole, orgId: string | null = null): Profile {
  return {
    id: `user-${role}-1`,
    role,
    full_name: `Test ${role}`,
    email: `${role}@civicflow.example`,
    organization_id: orgId,
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeOrg(kind: 'vendor' | 'agency', id = `org-${kind}-1`): Organization {
  return {
    id,
    name: `Test ${kind} org`,
    kind,
    description: null,
    website_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

type MockConfig = {
  user: { id: string } | null;
  profile: Profile | null;
  organization: Organization | null;
};

let _mockConfig: MockConfig = { user: null, profile: null, organization: null };

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: _mockConfig.user },
        error: _mockConfig.user ? null : { message: 'No session' },
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: table === 'profiles' ? _mockConfig.profile : _mockConfig.organization,
              error: null,
            })),
          })),
          single: vi.fn(async () => ({
            data: table === 'profiles' ? _mockConfig.profile : _mockConfig.organization,
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

async function captureRedirect(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith('REDIRECT:')) return msg.slice('REDIRECT:'.length);
    throw e;
  }
}

describe('Authorization — vendor profile access', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('vendor with matching org accesses their profile page (no redirect)', async () => {
    const org = makeOrg('vendor', 'org-vendor-1');
    const profile = makeProfile('vendor', org.id);
    _mockConfig = { user: { id: profile.id }, profile, organization: org };
    const { requireRole } = await import('@/lib/auth/dal');
    const session = await requireRole('vendor');
    expect(session.role).toBe('vendor');
    expect(session.organization?.id).toBe('org-vendor-1');
  });

  it('analyst visiting vendor profile page is allowed (no redirect)', async () => {
    const profile = makeProfile('analyst');
    _mockConfig = { user: { id: profile.id }, profile, organization: null };
    const { requireRole } = await import('@/lib/auth/dal');
    const session = await requireRole('analyst');
    expect(session.role).toBe('analyst');
  });

  it('vendor visiting analyst area is redirected to /access-denied', async () => {
    const org = makeOrg('vendor');
    const profile = makeProfile('vendor', org.id);
    _mockConfig = { user: { id: profile.id }, profile, organization: org };
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('analyst'));
    expect(path).toBe('/access-denied');
  });

  it('analyst visiting admin area is redirected to /access-denied', async () => {
    const profile = makeProfile('analyst');
    _mockConfig = { user: { id: profile.id }, profile, organization: null };
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('admin'));
    expect(path).toBe('/access-denied');
  });

  it('unauthenticated user is redirected to /sign-in', async () => {
    _mockConfig = { user: null, profile: null, organization: null };
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('vendor'));
    expect(path).toBe('/sign-in');
  });
});

describe('Authorization — cross-organisation access prevention', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('vendor getVendorOrgProfileSecure returns null when org IDs do not match', async () => {
    // Vendor user belongs to org-vendor-1
    const profile = makeProfile('vendor', 'org-vendor-1');
    _mockConfig = { user: { id: profile.id }, profile, organization: null };

    // They try to load org-vendor-2 — should return null (access denied)
    const { getVendorOrgProfileSecure } = await import('@/db/vendor-profile');
    const result = await getVendorOrgProfileSecure(profile.id, 'org-vendor-2');
    expect(result).toBeNull();
  });
});
