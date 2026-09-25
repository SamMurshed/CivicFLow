import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/** Route prefixes that require authentication (checked optimistically). */
const PROTECTED_PREFIXES = ['/vendor', '/agency', '/analyst', '/admin'];

/**
 * Supabase session-refresh proxy + optimistic auth guard.
 *
 * 1. Refreshes the Supabase auth token on every request so Server Components
 *    always receive a current session.
 * 2. Performs an optimistic (cookie-based) authentication check:
 *    - Unauthenticated visitors hitting protected routes → /sign-in
 *    - Authenticated visitors hitting /sign-in → role dashboard (via DAL in
 *      the sign-in page itself, not here, to keep this fast).
 *
 * This is the first line of defence only.  Role enforcement is also applied
 * in each protected route-group layout via requireRole() from the DAL.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Build a server client that can refresh the session cookie.
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session (side-effect: updates cookies in response).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Optimistic guard: protect route prefixes for unauthenticated users.
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !user) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If a signed-in user visits /sign-in, the sign-in page itself will
  // redirect them (it calls getSession and redirects — no extra work here).

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every request path except:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
};
