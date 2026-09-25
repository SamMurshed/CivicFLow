import { requireRole } from '@/lib/auth/dal';
import AppShell from '@/components/nav/AppShell';

/**
 * Vendor area layout.
 *
 * Calls requireRole('vendor') which will:
 *   - redirect to /sign-in if not authenticated
 *   - redirect to /access-denied if authenticated but wrong role
 */
export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('vendor');

  return <AppShell user={user}>{children}</AppShell>;
}
