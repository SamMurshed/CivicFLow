'use client';

/**
 * Sidebar — desktop navigation sidebar.
 *
 * Renders role-specific nav sections from nav-config.
 * Active state is detected from the current pathname.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavSection } from './nav-config';
import NavIcon from './NavIcon';

interface SidebarProps {
  sections: NavSection[];
}

export default function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-6 py-4">
      {sections.map((section, si) => (
        <div key={si}>
          {section.title && (
            <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              {section.title}
            </p>
          )}
          <ul role="list" className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <NavIcon path={item.iconPath} />
                    {item.label}
                    {isActive && <span className="sr-only">(current page)</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
