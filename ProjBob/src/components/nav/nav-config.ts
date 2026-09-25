/**
 * Role-aware navigation configuration.
 *
 * Each role gets its own set of nav items.
 * Icons are inline SVG path data strings (24×24 viewBox).
 */

import type { AppRole } from '@/types/database';

export interface NavItem {
  label: string;
  href: string;
  /** SVG path data for the 24×24 icon */
  iconPath: string;
  /** Exact match for active state (default: startsWith) */
  exact?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// ─── Icon paths ──────────────────────────────────────────────────────────────
// Minimal Heroicons-compatible paths

const Icons = {
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  folder:
    'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
  document:
    'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  users:
    'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  building:
    'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z',
  clipboard:
    'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
  chartBar:
    'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  magnifying:
    'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z',
  bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  shield:
    'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  cog: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  newspaper:
    'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z',
  envelope:
    'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  arrowRight: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
};

// ─── Per-role nav sections ────────────────────────────────────────────────────

const vendorNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/vendor/dashboard', iconPath: Icons.home, exact: true },
      {
        label: 'Procurement Requests',
        href: '/vendor/requests',
        iconPath: Icons.folder,
      },
      {
        label: 'Documents',
        href: '/vendor/documents',
        iconPath: Icons.document,
      },
      {
        label: 'Notifications',
        href: '/vendor/notifications',
        iconPath: Icons.bell,
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Vendor Profile',
        href: '/vendor/profile',
        iconPath: Icons.building,
      },
    ],
  },
];

const agencyNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/agency/dashboard', iconPath: Icons.home, exact: true },
      {
        label: 'Procurement Requests',
        href: '/agency/requests',
        iconPath: Icons.folder,
      },
      {
        label: 'Notifications',
        href: '/agency/notifications',
        iconPath: Icons.bell,
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Organisation',
        href: '/agency/organisation',
        iconPath: Icons.building,
      },
    ],
  },
];

const analystNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/analyst/dashboard', iconPath: Icons.home, exact: true },
      {
        label: 'Review Queue',
        href: '/analyst/queue',
        iconPath: Icons.clipboard,
      },
      {
        label: 'All Requests',
        href: '/analyst/requests',
        iconPath: Icons.folder,
      },
      {
        label: 'Notifications',
        href: '/analyst/notifications',
        iconPath: Icons.bell,
      },
    ],
  },
  {
    title: 'Tools',
    items: [
      {
        label: 'Checklist Templates',
        href: '/analyst/checklists',
        iconPath: Icons.clipboard,
      },
      {
        label: 'Knowledge Base',
        href: '/analyst/knowledge',
        iconPath: Icons.newspaper,
      },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', iconPath: Icons.home, exact: true },
      {
        label: 'All Requests',
        href: '/admin/requests',
        iconPath: Icons.folder,
      },
      {
        label: 'Reporting',
        href: '/admin/reporting',
        iconPath: Icons.chartBar,
      },
      {
        label: 'Audit Log',
        href: '/admin/audit',
        iconPath: Icons.shield,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        iconPath: Icons.users,
      },
      {
        label: 'Organisations',
        href: '/admin/organisations',
        iconPath: Icons.building,
      },
      {
        label: 'Checklist Templates',
        href: '/admin/checklists',
        iconPath: Icons.clipboard,
      },
      {
        label: 'Knowledge Base',
        href: '/admin/knowledge',
        iconPath: Icons.newspaper,
      },
      {
        label: 'Settings',
        href: '/admin/settings',
        iconPath: Icons.cog,
      },
    ],
  },
];

export const NAV_CONFIG: Record<AppRole, NavSection[]> = {
  vendor: vendorNav,
  agency_user: agencyNav,
  analyst: analystNav,
  admin: adminNav,
};

export const ROLE_LABEL: Record<AppRole, string> = {
  vendor: 'Vendor',
  agency_user: 'Agency User',
  analyst: 'Procurement Analyst',
  admin: 'Administrator',
};

export const ROLE_BADGE_CLASS: Record<AppRole, string> = {
  vendor: 'bg-blue-100 text-blue-700',
  agency_user: 'bg-emerald-100 text-emerald-700',
  analyst: 'bg-violet-100 text-violet-700',
  admin: 'bg-amber-100 text-amber-700',
};
