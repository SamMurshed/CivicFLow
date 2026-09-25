/**
 * Data Access Layer — Authentication & Authorization
 *
 * Server-only helpers that verify the current session and load the signed-in
 * user's profile and organisation from Supabase.
 *
 * All exported functions are memoised with `React.cache` so that multiple
 * callsites within the same server render share a single round-trip.
 *
 * Never import this file from client components.
 */
import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppRole, Organization, Profile } from '@/types/database';

// ─── Exported shape ────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  role: AppRole;
  profile: Profile;
  organization: Organization | null;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Fetches the current Supabase auth user, then loads the matching profile
 * and organisation row.  Returns `null` when there is no active session.
 *
 * Memoised per render — safe to call from multiple Server Components.
 */
const _loadSession = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Auth user exists but no profile row — treat as unauthenticated.
    return null;
  }

  let organization: Organization | null = null;

  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single();

    organization = org ?? null;
  }

  return { id: user.id, role: profile.role, profile, organization };
});

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Returns the current session user, or `null` if not signed in.
 * Does NOT redirect — use `requireAuth` when the page requires a session.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  return _loadSession();
});

/**
 * Returns the current session user.
 * Redirects to `/sign-in` if the user is not authenticated.
 */
export const requireAuth = cache(async (): Promise<SessionUser> => {
  const session = await _loadSession();
  if (!session) {
    redirect('/sign-in');
  }
  return session;
});

/**
 * Returns the current session user only if they have one of the allowed roles.
 * Redirects to `/sign-in` when unauthenticated.
 * Redirects to `/access-denied` when authenticated but the role does not match.
 */
export async function requireRole(...allowedRoles: AppRole[]): Promise<SessionUser> {
  const session = await _loadSession();
  if (!session) {
    redirect('/sign-in');
  }
  if (!allowedRoles.includes(session.role)) {
    redirect('/access-denied');
  }
  return session;
}
