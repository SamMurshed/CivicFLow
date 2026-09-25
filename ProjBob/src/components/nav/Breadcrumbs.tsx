'use client';

/**
 * Breadcrumbs — derives breadcrumb trail from the current pathname.
 *
 * Renders a visually-separated trail and an accessible <nav> landmark.
 * The last item is the current page and is not a link.
 *
 * Segment labels are formatted from URL slugs (hyphens → spaces, title-case).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Map specific path segments to friendlier labels. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  requests: 'Procurement Requests',
  documents: 'Documents',
  notifications: 'Notifications',
  profile: 'Vendor Profile',
  organisation: 'Organisation',
  queue: 'Review Queue',
  checklists: 'Checklist Templates',
  knowledge: 'Knowledge Base',
  reporting: 'Reporting',
  audit: 'Audit Log',
  users: 'Users',
  organisations: 'Organisations',
  settings: 'Settings',
  vendor: 'Vendor',
  agency: 'Agency',
  analyst: 'Analyst',
  admin: 'Admin',
};

function formatSegment(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let accumulated = '';

  for (const segment of segments) {
    accumulated += `/${segment}`;
    crumbs.push({ label: formatSegment(segment), href: accumulated });
  }

  return crumbs;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-x-1 text-sm text-slate-500">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-x-1">
              {i > 0 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-3 w-3 shrink-0 text-slate-400"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium text-slate-700">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-slate-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
