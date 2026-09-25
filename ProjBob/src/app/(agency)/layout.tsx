import { requireRole } from '@/lib/auth/dal';
import AppShell from '@/components/nav/AppShell';

/**
 * Agency User area layout.
 *
 * Calls requireRole('agency_user') which will:
 *   - redirect to /sign-in if not authenticated
 *   - redirect to /access-denied if authenticated but wrong role
 */
export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('agency_user');

  return <AppShell user={user}>{children}</AppShell>;
}
