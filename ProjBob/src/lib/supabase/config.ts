/**
 * Supabase configuration helpers.
 *
 * `getSupabaseConfig` validates that the required public environment variables
 * are present and returns them in a typed object.  It throws at runtime when
 * values are missing so that errors surface early rather than silently
 * producing an un-authenticated client.
 *
 * This module must only reference NEXT_PUBLIC_* variables so that it is safe
 * to import from both server and browser code.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
    );
  }

  return { url, anonKey };
}

/** Returns true when both public env vars are non-empty strings. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
