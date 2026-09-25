import { requireRole } from '@/lib/auth/dal';
import AppShell from '@/components/nav/AppShell';

/**
 * Analyst area layout.
 *
 * Calls requireRole('analyst') which will:
 *   - redirect to /sign-in if not authenticated
 *   - redirect to /access-denied if authenticated but wrong role
 */
export default async function AnalystLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('analyst');

  return <AppShell user={user}>{children}</AppShell>;
}
