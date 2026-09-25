import { signOut } from '@/lib/auth/actions';
import type { SessionUser } from '@/lib/auth/dal';

const ROLE_LABEL: Record<string, string> = {
  vendor: 'Vendor',
  agency_user: 'Agency User',
  analyst: 'Procurement Analyst',
  admin: 'Administrator',
};

interface UserMenuProps {
  user: SessionUser;
}

/**
 * Server component that renders the signed-in user's name, organisation,
 * and role, plus a sign-out form.
 *
 * Receives `user` as a prop — the parent layout calls requireRole() and
 * passes the resolved user down, keeping all auth work on the server.
 */
export default function UserMenu({ user }: UserMenuProps) {
  const { profile, organization, role } = user;
  const roleLabel = ROLE_LABEL[role] ?? role;

  return (
    <div className="flex items-center gap-4">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-900 leading-tight">{profile.full_name}</p>
        <p className="text-xs text-slate-500 leading-tight">
          {organization ? organization.name : roleLabel}
          {organization && (
            <span className="ml-1 text-slate-400">· {roleLabel}</span>
          )}
        </p>
      </div>

      {/* Avatar circle with initials */}
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
      >
        {profile.full_name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase()}
      </div>

      {/* Sign-out button */}
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
