import Link from 'next/link';
import { getSession } from '@/lib/auth/dal';

const ROLE_DASHBOARD = {
  vendor: '/vendor/dashboard',
  agency_user: '/agency/dashboard',
  analyst: '/analyst/dashboard',
  admin: '/admin/dashboard',
} as const;

/**
 * Access-denied page.
 *
 * Shown when an authenticated user attempts to access a route that requires
 * a different role.  Offers a link back to their own dashboard.
 */
export default async function AccessDeniedPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 text-5xl font-extrabold text-slate-300" aria-hidden="true">
          403
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="mb-8 text-sm leading-6 text-slate-600">
          You do not have permission to view this page. If you believe this is an error, please
          contact your administrator.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {session ? (
            <Link
              href={ROLE_DASHBOARD[session.role]}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Go to my dashboard
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
