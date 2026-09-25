'use server';

/**
 * Auth Server Actions
 *
 * sign-in and sign-out flows backed by Supabase Auth.
 * These are the only places in the application that call
 * `supabase.auth.signInWithPassword` or `supabase.auth.signOut`.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/types/database';

/** Role → dashboard path mapping. */
const ROLE_DASHBOARD: Record<AppRole, string> = {
  vendor: '/vendor/dashboard',
  agency_user: '/agency/dashboard',
  analyst: '/analyst/dashboard',
  admin: '/admin/dashboard',
};

export interface SignInState {
  error: string | null;
}

/**
 * Authenticates the user with Supabase Auth (email + password).
 * On success, loads the user's profile to determine the role and
 * redirects to the appropriate role dashboard.
 * On failure, returns an error message for the form.
 */
export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Email and password are required.' };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error || !data.user) {
    return { error: 'Invalid email or password.' };
  }

  // Load profile to resolve role → dashboard path.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<{ role: import('@/types/database').AppRole }>();

  if (profileError || !profile) {
    // Auth succeeded but no profile exists — sign out and surface an error.
    await supabase.auth.signOut();
    return { error: 'Account configuration error. Please contact support.' };
  }

  redirect(ROLE_DASHBOARD[profile.role]);
}

/**
 * Signs the user out and redirects to the home page.
 */
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
