import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/dal';
import SignInForm from './SignInForm';

const ROLE_DASHBOARD = {
  vendor: '/vendor/dashboard',
  agency_user: '/agency/dashboard',
  analyst: '/analyst/dashboard',
  admin: '/admin/dashboard',
} as const;

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * Sign-in page.
 *
 * - Already-authenticated users are immediately redirected to their dashboard.
 * - The `next` query parameter is forwarded to the form so the user lands on
 *   the page they originally requested.
 */
export default async function SignInPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (session) {
    redirect(ROLE_DASHBOARD[session.role]);
  }

  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to CivicFlow</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to your account</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <SignInForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Fictional demonstration platform — no real data.
        </p>
      </div>
    </div>
  );
}
