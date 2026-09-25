/**
 * Notification helper.
 *
 * Creates notifications for workflow events.  Must be called from server-side
 * code only.  Failures are silently swallowed so they never block primary ops.
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface NotifyParams {
  recipient_id: string;
  request_id?: string;
  title: string;
  body: string;
  link?: string;
}

/**
 * Inserts a single notification row.
 */
export async function notify(params: NotifyParams): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('notifications').insert({
      recipient_id: params.recipient_id,
      request_id: params.request_id ?? null,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
      is_read: false,
    });
  } catch {
    // intentional: notification failures must not surface to the user
  }
}

/**
 * Notifies multiple recipients (no-throw batch insert).
 */
export async function notifyMany(notifications: NotifyParams[]): Promise<void> {
  if (notifications.length === 0) return;
  try {
    const supabase = await createClient();
    await supabase.from('notifications').insert(
      notifications.map((n) => ({
        recipient_id: n.recipient_id,
        request_id: n.request_id ?? null,
        title: n.title,
        body: n.body,
        link: n.link ?? null,
        is_read: false,
      })),
    );
  } catch {
    // intentional
  }
}
