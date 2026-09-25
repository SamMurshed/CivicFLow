import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';

/**
 * Returns a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions.
 *
 * Reads and writes cookies via `next/headers` so that the user session is
 * automatically refreshed on each server render.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // `setAll` is called from a Server Component where cookies cannot be
          // mutated.  The session will still be refreshed by the proxy layer.
        }
      },
    },
  });
}
