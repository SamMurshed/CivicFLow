import { requireRole } from '@/lib/auth/dal';
import AppShell from '@/components/nav/AppShell';

/**
 * Administrator area layout.
 *
 * Calls requireRole('admin') which will:
 *   - redirect to /sign-in if not authenticated
 *   - redirect to /access-denied if authenticated but wrong role
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin');

  return <AppShell user={user}>{children}</AppShell>;
}
