/**
 * Activity log helper.
 *
 * Writes append-only activity log entries.  Only event-level metadata is
 * stored — no sensitive before/after field values.
 *
 * Must be called from server-side code only (Server Actions or Route Handlers).
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface LogEventParams {
  actor_id: string | null;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  /** Non-sensitive metadata only — never include PII or field-level diffs */
  metadata?: Record<string, unknown>;
}

/**
 * Appends a single activity log entry.
 *
 * Failures are silently swallowed — activity logging must never block the
 * primary operation.
 */
export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('activity_log').insert({
      actor_id: params.actor_id,
      event_type: params.event_type,
      entity_type: params.entity_type ?? null,
      entity_id: params.entity_id ?? null,
      metadata: params.metadata ?? null,
      request_id: null,
      ip_address: null,
      user_agent: null,
    });
  } catch {
    // intentional: log failures must not surface to the user
  }
}
