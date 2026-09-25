/**
 * Navigation config tests.
 *
 * Verifies that each role has a non-empty nav config,
 * all href values are non-empty, and role labels/badge classes are defined.
 */

import { describe, it, expect } from 'vitest';
import { NAV_CONFIG, ROLE_LABEL, ROLE_BADGE_CLASS } from '@/components/nav/nav-config';
import type { AppRole } from '@/types/database';

const roles: AppRole[] = ['vendor', 'agency_user', 'analyst', 'admin'];

describe('NAV_CONFIG', () => {
  roles.forEach((role) => {
    it(`"${role}" has at least one nav item`, () => {
      const sections = NAV_CONFIG[role];
      const allItems = sections.flatMap((s) => s.items);
      expect(allItems.length).toBeGreaterThan(0);
    });

    it(`all "${role}" nav items have non-empty hrefs`, () => {
      const sections = NAV_CONFIG[role];
      sections
        .flatMap((s) => s.items)
        .forEach((item) => {
          expect(item.href).toBeTruthy();
          expect(item.href.startsWith('/')).toBe(true);
        });
    });

    it(`all "${role}" nav items have non-empty labels`, () => {
      const sections = NAV_CONFIG[role];
      sections
        .flatMap((s) => s.items)
        .forEach((item) => {
          expect(item.label.length).toBeGreaterThan(0);
        });
    });
  });
});

describe('ROLE_LABEL', () => {
  roles.forEach((role) => {
    it(`has a label for "${role}"`, () => {
      expect(ROLE_LABEL[role]).toBeTruthy();
    });
  });
});

describe('ROLE_BADGE_CLASS', () => {
  roles.forEach((role) => {
    it(`has badge classes for "${role}"`, () => {
      expect(ROLE_BADGE_CLASS[role]).toBeTruthy();
    });
  });
});
