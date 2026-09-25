/**
 * Authorization unit tests.
 *
 * These tests exercise the server-side authorization helpers (dal.ts) and the
 * sign-in action (actions.ts) in isolation using Vitest mocks — no real
 * Supabase connection is required.
 *
 * Coverage goals (per acceptance criteria):
 *   • At least one allowed and one denied case per role.
 *   • Unauthenticated access to protected pages → redirect to /sign-in.
 *   • Wrong-role access to protected pages → redirect to /access-denied.
 *   • Sign-out invalidates the session path.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ─── Mock next/navigation ─────────────────────────────────────────────────
// redirect() in Next.js throws a special error internally; we capture calls.
const mockRedirect = vi.fn((path: string): never => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

// ─── Mock server-only ─────────────────────────────────────────────────────
vi.mock('server-only', () => ({}));

// ─── Shared test fixtures ─────────────────────────────────────────────────

import type { Profile, Organization, AppRole } from '@/types/database';

function makeProfile(role: AppRole): Profile {
  const orgMap: Partial<Record<AppRole, string>> = {
    agency_user: 'org-agency-1',
    vendor: 'org-vendor-1',
  };
  return {
    id: `user-${role}`,
    role,
    full_name: `Test ${role}`,
    email: `${role}@civicflow.example`,
    organization_id: orgMap[role] ?? null,
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeOrg(kind: 'agency' | 'vendor'): Organization {
  return {
    id: `org-${kind}-1`,
    name: `Test ${kind} org`,
    kind,
    description: null,
    website_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ─── Mock @/lib/supabase/server ───────────────────────────────────────────

type SupabaseMockConfig = {
  user: { id: string } | null;
  profile: Profile | null;
  organization: Organization | null;
};

let _mockConfig: SupabaseMockConfig = { user: null, profile: null, organization: null };

function configureMock(config: SupabaseMockConfig) {
  _mockConfig = config;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: _mockConfig.user },
        error: _mockConfig.user ? null : { message: 'Not authenticated' },
      })),
      signInWithPassword: vi.fn(async ({ email }: { email: string }) => {
        if (email === 'bad@civicflow.example') {
          return { data: { user: null }, error: { message: 'Invalid credentials' } };
        }
        return { data: { user: _mockConfig.user }, error: null };
      }),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => {
            if (table === 'profiles') {
              return { data: _mockConfig.profile, error: _mockConfig.profile ? null : { message: 'Not found' } };
            }
            if (table === 'organizations') {
              return { data: _mockConfig.organization, error: _mockConfig.organization ? null : { message: 'Not found' } };
            }
            return { data: null, error: { message: 'Unknown table' } };
          }),
        })),
      })),
    })),
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Calls an async fn and returns the redirect path, or null if no redirect. */
async function captureRedirect(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.startsWith('REDIRECT:')) {
      return msg.slice('REDIRECT:'.length);
    }
    throw e;
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('getSession', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('returns null when there is no auth session', async () => {
    configureMock({ user: null, profile: null, organization: null });
    const { getSession } = await import('@/lib/auth/dal');
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when auth user has no profile', async () => {
    configureMock({ user: { id: 'orphan-id' }, profile: null, organization: null });
    const { getSession } = await import('@/lib/auth/dal');
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns session with profile and organization for vendor', async () => {
    const profile = makeProfile('vendor');
    const org = makeOrg('vendor');
    configureMock({ user: { id: profile.id }, profile, organization: org });
    const { getSession } = await import('@/lib/auth/dal');
    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result!.role).toBe('vendor');
    expect(result!.profile.full_name).toBe('Test vendor');
    expect(result!.organization?.name).toBe('Test vendor org');
  });

  it('returns session with null organization for analyst (no org)', async () => {
    const profile = makeProfile('analyst');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { getSession } = await import('@/lib/auth/dal');
    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result!.role).toBe('analyst');
    expect(result!.organization).toBeNull();
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('redirects to /sign-in when not authenticated', async () => {
    configureMock({ user: null, profile: null, organization: null });
    const { requireAuth } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireAuth());
    expect(path).toBe('/sign-in');
  });

  it('returns session when authenticated', async () => {
    const profile = makeProfile('admin');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { requireAuth } = await import('@/lib/auth/dal');
    const result = await requireAuth();
    expect(result.role).toBe('admin');
  });
});

describe('requireRole — vendor', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('allows access when user has the vendor role', async () => {
    const profile = makeProfile('vendor');
    const org = makeOrg('vendor');
    configureMock({ user: { id: profile.id }, profile, organization: org });
    const { requireRole } = await import('@/lib/auth/dal');
    const result = await requireRole('vendor');
    expect(result.role).toBe('vendor');
  });

  it('denies access and redirects to /access-denied for analyst visiting vendor area', async () => {
    const profile = makeProfile('analyst');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('vendor'));
    expect(path).toBe('/access-denied');
  });

  it('denies access and redirects to /sign-in for unauthenticated user', async () => {
    configureMock({ user: null, profile: null, organization: null });
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('vendor'));
    expect(path).toBe('/sign-in');
  });
});

describe('requireRole — agency_user', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('allows access when user has the agency_user role', async () => {
    const profile = makeProfile('agency_user');
    const org = makeOrg('agency');
    configureMock({ user: { id: profile.id }, profile, organization: org });
    const { requireRole } = await import('@/lib/auth/dal');
    const result = await requireRole('agency_user');
    expect(result.role).toBe('agency_user');
  });

  it('denies access for vendor visiting agency area', async () => {
    const profile = makeProfile('vendor');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('agency_user'));
    expect(path).toBe('/access-denied');
  });
});

describe('requireRole — analyst', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('allows access when user has the analyst role', async () => {
    const profile = makeProfile('analyst');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { requireRole } = await import('@/lib/auth/dal');
    const result = await requireRole('analyst');
    expect(result.role).toBe('analyst');
  });

  it('denies access for agency_user visiting analyst area', async () => {
    const profile = makeProfile('agency_user');
    const org = makeOrg('agency');
    configureMock({ user: { id: profile.id }, profile, organization: org });
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('analyst'));
    expect(path).toBe('/access-denied');
  });
});

describe('requireRole — admin', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('allows access when user has the admin role', async () => {
    const profile = makeProfile('admin');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { requireRole } = await import('@/lib/auth/dal');
    const result = await requireRole('admin');
    expect(result.role).toBe('admin');
  });

  it('denies access for vendor visiting admin area', async () => {
    const profile = makeProfile('vendor');
    const org = makeOrg('vendor');
    configureMock({ user: { id: profile.id }, profile, organization: org });
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('admin'));
    expect(path).toBe('/access-denied');
  });

  it('denies access for analyst visiting admin area', async () => {
    const profile = makeProfile('analyst');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { requireRole } = await import('@/lib/auth/dal');
    const path = await captureRedirect(() => requireRole('admin'));
    expect(path).toBe('/access-denied');
  });
});

describe('signIn action', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('returns error for invalid credentials', async () => {
    configureMock({ user: null, profile: null, organization: null });
    const { signIn } = await import('@/lib/auth/actions');
    const formData = new FormData();
    formData.set('email', 'bad@civicflow.example');
    formData.set('password', 'wrong');
    const result = await signIn({ error: null }, formData);
    expect(result.error).toBeTruthy();
  });

  it('returns error when email or password is missing', async () => {
    const { signIn } = await import('@/lib/auth/actions');
    const formData = new FormData();
    // no email, no password
    const result = await signIn({ error: null }, formData);
    expect(result.error).toBe('Email and password are required.');
  });

  it('redirects to vendor dashboard on successful vendor sign-in', async () => {
    const profile = makeProfile('vendor');
    const org = makeOrg('vendor');
    configureMock({ user: { id: profile.id }, profile, organization: org });
    const { signIn } = await import('@/lib/auth/actions');
    const formData = new FormData();
    formData.set('email', 'vendor.chen@apex.example');
    formData.set('password', 'Demo1234!');
    const path = await captureRedirect(() => signIn({ error: null }, formData));
    expect(path).toBe('/vendor/dashboard');
  });

  it('redirects to analyst dashboard on successful analyst sign-in', async () => {
    const profile = makeProfile('analyst');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { signIn } = await import('@/lib/auth/actions');
    const formData = new FormData();
    formData.set('email', 'analyst.morgan@civicflow.example');
    formData.set('password', 'Demo1234!');
    const path = await captureRedirect(() => signIn({ error: null }, formData));
    expect(path).toBe('/analyst/dashboard');
  });

  it('redirects to admin dashboard on successful admin sign-in', async () => {
    const profile = makeProfile('admin');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { signIn } = await import('@/lib/auth/actions');
    const formData = new FormData();
    formData.set('email', 'admin@civicflow.example');
    formData.set('password', 'Demo1234!');
    const path = await captureRedirect(() => signIn({ error: null }, formData));
    expect(path).toBe('/admin/dashboard');
  });
});

describe('signOut action', () => {
  beforeEach(() => {
    vi.resetModules();
    mockRedirect.mockClear();
  });

  it('redirects to / after sign-out', async () => {
    const profile = makeProfile('vendor');
    configureMock({ user: { id: profile.id }, profile, organization: null });
    const { signOut } = await import('@/lib/auth/actions');
    const path = await captureRedirect(() => signOut());
    expect(path).toBe('/');
  });
});
