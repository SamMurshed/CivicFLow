import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface HealthCheckResult {
  configured: boolean;
  reachable: boolean;
  error: string | null;
}

/**
 * Verifies Supabase connectivity from the server side.
 *
 * Performs a minimal authenticated query (`auth.getUser`) to confirm the
 * database URL and anon key are valid and the service is reachable.
 * Returns a typed result object — never throws.
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  if (!isSupabaseConfigured()) {
    return { configured: false, reachable: false, error: null };
  }

  try {
    const supabase = await createClient();
    // getUser() is a lightweight round-trip that confirms connectivity without
    // requiring an active session.
    const { error } = await supabase.auth.getUser();

    // A "user not found" / no-session error still means the API is reachable.
    const isAuthError =
      error?.message?.toLowerCase().includes('not authenticated') ||
      error?.message?.toLowerCase().includes('jwt') ||
      error === null;

    if (isAuthError || error === null) {
      return { configured: true, reachable: true, error: null };
    }

    return { configured: true, reachable: false, error: error.message };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { configured: true, reachable: false, error: message };
  }
}
