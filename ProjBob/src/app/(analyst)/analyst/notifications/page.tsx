import { requireRole } from '@/lib/auth/dal';
import { getUserNotifications } from '@/db/procurement-requests';
import { EmptyState } from '@/components/ui';
import NotificationItem from '@/components/shared/NotificationItem';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AnalystNotificationsPage({ searchParams }: PageProps) {
  const user = await requireRole('analyst', 'admin');
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);

  const { notifications, total } = await getUserNotifications(user.id, page, 30);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-0.5 text-sm text-slate-500">{total} notification{total !== 1 ? 's' : ''}</p>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You have no notifications at this time."
          iconPath="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
