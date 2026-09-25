'use client';

/**
 * NotificationItem — marks a single notification as read on click.
 */

import { useActionState } from 'react';
import { markNotificationRead, INITIAL_STATE } from '@/lib/review-actions';
import Link from 'next/link';
import type { Notification } from '@/types/database';

interface Props {
  notification: Notification;
}

export default function NotificationItem({ notification }: Props) {
  const [, formAction] = useActionState(markNotificationRead, INITIAL_STATE);

  return (
    <li
      className={[
        'flex items-start gap-3 px-5 py-4',
        notification.is_read ? 'opacity-60' : '',
      ].join(' ')}
    >
      {/* Unread indicator */}
      <span
        className={[
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          notification.is_read ? 'bg-transparent' : 'bg-blue-500',
        ].join(' ')}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-800">{notification.title}</p>
          <span className="shrink-0 text-xs text-slate-400">
            {new Date(notification.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{notification.body}</p>
        {notification.link && (
          <Link
            href={notification.link}
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            View request →
          </Link>
        )}
      </div>

      {!notification.is_read && (
        <form action={formAction} className="shrink-0">
          <input type="hidden" name="notification_id" value={notification.id} />
          <button
            type="submit"
            className="text-xs text-slate-400 hover:text-slate-700"
            title="Mark as read"
          >
            ✕
          </button>
        </form>
      )}
    </li>
  );
}
