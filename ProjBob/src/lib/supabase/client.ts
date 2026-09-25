'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from '@/lib/supabase/config';

/**
 * Returns a Supabase client suitable for use in Client Components.
 *
 * Call this inside a component or hook — do not instantiate at module level
 * so that the environment variables are read after Next.js has loaded them.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
