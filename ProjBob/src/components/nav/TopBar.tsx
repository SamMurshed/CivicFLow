'use client';

/**
 * TopBar — persistent top navigation bar.
 *
 * Contains:
 * - Hamburger button (mobile only)
 * - CivicFlow wordmark + role badge
 * - User info + sign-out button
 */

import { useState } from 'react';
import type { AppRole } from '@/types/database';
import type { NavSection } from './nav-config';
import { ROLE_BADGE_CLASS, ROLE_LABEL } from './nav-config';
import MobileNav from './MobileNav';
import { signOut } from '@/lib/auth/actions';

interface TopBarProps {
  userName: string;
  orgName: string | null;
  role: AppRole;
  avatarInitials: string;
  navSections: NavSection[];
}

export default function TopBar({
  userName,
  orgName,
  role,
  avatarInitials,
  navSections,
}: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLabel = ROLE_LABEL[role];
  const badgeClass = ROLE_BADGE_CLASS[role];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          {/* Hamburger (mobile only) */}
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-dialog"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900">CivicFlow</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
              aria-label={`Role: ${roleLabel}`}
            >
              {roleLabel}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* User info (hidden on very small screens) */}
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium text-slate-900">{userName}</p>
              <p className="text-xs leading-tight text-slate-500">{orgName ?? roleLabel}</p>
            </div>

            {/* Avatar */}
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
            >
              {avatarInitials}
            </div>

            {/* Sign out */}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <MobileNav sections={navSections} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
