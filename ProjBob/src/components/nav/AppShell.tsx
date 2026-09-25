/**
 * AppShell — root layout shell used by all role layouts.
 *
 * Structure:
 *   <TopBar>          sticky top bar (all breakpoints)
 *   <div class="body">
 *     <aside>         sidebar (hidden on mobile, lg:block)
 *     <main>          main content region
 *   </div>
 *
 * This component is a Server Component — it receives the session user from the
 * role layout and passes serialisable props down to the client TopBar/Sidebar.
 */

import type { SessionUser } from '@/lib/auth/dal';
import { NAV_CONFIG } from './nav-config';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const { profile, organization, role } = user;
  const navSections = NAV_CONFIG[role];

  const avatarInitials = profile.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Skip to main content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <TopBar
        userName={profile.full_name}
        orgName={organization?.name ?? null}
        role={role}
        avatarInitials={avatarInitials}
        navSections={navSections}
      />

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-3 lg:block xl:w-64"
          aria-label="Sidebar navigation"
        >
          <Sidebar sections={navSections} />
        </aside>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
