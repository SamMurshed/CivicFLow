'use server';

/**
 * Review Actions — Server Actions
 *
 * recordReviewDecision — analyst approves, rejects, requests corrections, etc.
 * assignAnalyst        — admin assigns an analyst to a request
 * postComment          — any party posts a comment (internal or external)
 * markNotificationRead — mark a notification as read
 *
 * Every mutation enforces server-side authorization and writes audit trail
 * entries (status_history + activity_log).
 */

import { requireRole } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { logEvent } from '@/lib/activity-log';
import { notify } from '@/lib/notifications';
import {
  reviewActionSchema,
  commentSchema,
  DECISION_TO_STATUS,
  isTransitionAllowed,
} from '@/validation/procurement-request';
import type { ActionState } from '@/lib/vendor-profile-actions';
import type { RequestStatus } from '@/types/database';

export type { ActionState };
export const INITIAL_STATE: ActionState = { success: false, error: null, fieldErrors: {} };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function recordStatusTransition(
  requestId: string,
  changedBy: string,
  fromStatus: RequestStatus | null,
  toStatus: RequestStatus,
  reason?: string | null,
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('status_history').insert({
      request_id: requestId,
      changed_by: changedBy,
      from_status: fromStatus,
      to_status: toStatus,
      reason: reason ?? null,
    });
  } catch {
    // non-blocking
  }
}

// ─── recordReviewDecision ─────────────────────────────────────────────────────

/**
 * Records a formal analyst decision on a request.
 * Validates the transition, updates status, writes review_actions, status_history,
 * activity_log, and sends a notification to the submitter.
 */
export async function recordReviewDecision(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('analyst', 'admin');

  const raw = {
    request_id: formData.get('request_id'),
    decision: formData.get('decision'),
    note: formData.get('note') || null,
  };

  const parsed = reviewActionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: 'Please correct the errors below.', fieldErrors };
  }

  const supabase = await createClient();

  // Fetch the request
  const { data: req, error: fetchErr } = await supabase
    .from('procurement_requests')
    .select('id, status, submitted_by, assigned_analyst, title, agency_org_id')
    .eq('id', parsed.data.request_id)
    .single();

  if (fetchErr || !req) {
    return { success: false, error: 'Request not found.', fieldErrors: {} };
  }

  // Analysts may only act on requests they are assigned to (admins bypass)
  if (user.role === 'analyst' && req.assigned_analyst !== user.id) {
    // Allow unassigned submissions to be claimed
    if (req.status !== 'submitted') {
      return { success: false, error: 'You are not assigned to this request.', fieldErrors: {} };
    }
  }

  // Validate transition
  const currentStatus = req.status as RequestStatus;
  if (!isTransitionAllowed(currentStatus, parsed.data.decision)) {
    return {
      success: false,
      error: `The "${parsed.data.decision}" action is not allowed from the "${currentStatus}" status.`,
      fieldErrors: {},
    };
  }

  const newStatus = DECISION_TO_STATUS[parsed.data.decision];

  // Decide times
  const isTerminal = newStatus === 'approved' || newStatus === 'rejected';
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    // Set assigned_analyst when analyst first acts
    assigned_analyst: req.assigned_analyst ?? user.id,
  };
  if (newStatus === 'under_review' && currentStatus === 'submitted') {
    updatePayload.assigned_analyst = user.id;
  }
  if (isTerminal) {
    updatePayload.decided_at = now;
    updatePayload.decision_rationale = parsed.data.note;
  }

  const { error: updateErr } = await supabase
    .from('procurement_requests')
    .update(updatePayload)
    .eq('id', parsed.data.request_id);

  if (updateErr) {
    return { success: false, error: 'Failed to record decision. Please try again.', fieldErrors: {} };
  }

  // Append review action record
  await supabase.from('review_actions').insert({
    request_id: parsed.data.request_id,
    analyst_id: user.id,
    decision: parsed.data.decision,
    note: parsed.data.note,
  });

  // Status history
  await recordStatusTransition(
    parsed.data.request_id,
    user.id,
    currentStatus,
    newStatus,
    parsed.data.note,
  );

  await logEvent({
    actor_id: user.id,
    event_type: `procurement_request.${parsed.data.decision}`,
    entity_type: 'procurement_request',
    entity_id: parsed.data.request_id,
    metadata: { from_status: currentStatus, to_status: newStatus },
  });

  // Notify the submitter
  const notificationMessages: Record<string, { title: string; body: string }> = {
    approve: {
      title: 'Your request has been approved',
      body: `"${req.title}" has been approved.`,
    },
    reject: {
      title: 'Your request has been rejected',
      body: `"${req.title}" has been rejected. Please review the analyst's feedback.`,
    },
    request_correction: {
      title: 'Corrections requested on your submission',
      body: `An analyst has requested corrections for "${req.title}". Please review the feedback and resubmit.`,
    },
    place_on_hold: {
      title: 'Your request has been placed on hold',
      body: `"${req.title}" has been placed on hold pending further review.`,
    },
    resume_from_hold: {
      title: 'Your request has resumed review',
      body: `"${req.title}" has been resumed and is now under review.`,
    },
  };

  const msg = notificationMessages[parsed.data.decision];
  if (msg) {
    await notify({
      recipient_id: req.submitted_by,
      request_id: parsed.data.request_id,
      title: msg.title,
      body: msg.body,
      link: `/agency/requests/${parsed.data.request_id}`,
    });
  }

  return { success: true, error: null, fieldErrors: {} };
}

// ─── assignAnalyst ────────────────────────────────────────────────────────────

/**
 * Admin assigns (or re-assigns) an analyst to a request.
 */
export async function assignAnalyst(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('admin');

  const requestId = formData.get('request_id') as string;
  const analystId = formData.get('analyst_id') as string;

  if (!requestId || !analystId) {
    return { success: false, error: 'Request ID and analyst ID are required.', fieldErrors: {} };
  }

  const supabase = await createClient();

  // Verify analyst role
  const { data: analystProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', analystId)
    .single();

  if (!analystProfile || (analystProfile as { role: string }).role !== 'analyst') {
    return { success: false, error: 'Selected user is not an analyst.', fieldErrors: {} };
  }

  const { error: updateErr } = await supabase
    .from('procurement_requests')
    .update({ assigned_analyst: analystId })
    .eq('id', requestId);

  if (updateErr) {
    return { success: false, error: 'Failed to assign analyst.', fieldErrors: {} };
  }

  await logEvent({
    actor_id: user.id,
    event_type: 'procurement_request.analyst_assigned',
    entity_type: 'procurement_request',
    entity_id: requestId,
    metadata: { analyst_id: analystId },
  });

  // Notify the newly assigned analyst
  const { data: req } = await supabase
    .from('procurement_requests')
    .select('title')
    .eq('id', requestId)
    .single();

  if (req) {
    await notify({
      recipient_id: analystId,
      request_id: requestId,
      title: 'Request assigned to you',
      body: `You have been assigned to review "${(req as { title: string }).title}".`,
      link: `/analyst/queue/${requestId}`,
    });
  }

  return { success: true, error: null, fieldErrors: {} };
}

// ─── postComment ──────────────────────────────────────────────────────────────

/**
 * Posts a comment on a request.
 * Agency users and vendors may only post non-internal comments.
 * Analysts and admins may post internal (analyst-only) notes.
 */
export async function postComment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user', 'analyst', 'admin', 'vendor');

  const raw = {
    request_id: formData.get('request_id'),
    body: formData.get('body'),
    is_internal:
      formData.get('is_internal') === 'true' &&
      (user.role === 'analyst' || user.role === 'admin'),
    parent_id: formData.get('parent_id') || null,
  };

  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: 'Please correct the errors below.', fieldErrors };
  }

  const supabase = await createClient();

  const { error: insertErr } = await supabase.from('comments').insert({
    request_id: parsed.data.request_id,
    author_id: user.id,
    body: parsed.data.body,
    is_internal: parsed.data.is_internal,
    parent_id: parsed.data.parent_id ?? null,
  });

  if (insertErr) {
    return { success: false, error: 'Failed to post comment. Please try again.', fieldErrors: {} };
  }

  await logEvent({
    actor_id: user.id,
    event_type: parsed.data.is_internal
      ? 'comment.internal_posted'
      : 'comment.posted',
    entity_type: 'comment',
    entity_id: parsed.data.request_id,
  });

  return { success: true, error: null, fieldErrors: {} };
}

// ─── markNotificationRead ─────────────────────────────────────────────────────

/**
 * Marks one or all notifications as read for the current user.
 */
export async function markNotificationRead(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user', 'analyst', 'admin', 'vendor');

  const notificationId = formData.get('notification_id') as string | null;
  const markAll = formData.get('mark_all') === 'true';

  const supabase = await createClient();

  if (markAll) {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  } else if (notificationId) {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('recipient_id', user.id);
  }

  return { success: true, error: null, fieldErrors: {} };
}

// ─── uploadDocument (metadata only) ──────────────────────────────────────────

/**
 * Records document metadata after a file has been uploaded to Supabase Storage.
 * The client uploads the file directly to Storage; this action just records the
 * metadata row and marks the checklist item as satisfied.
 */
export async function recordDocumentUpload(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user', 'vendor', 'analyst', 'admin');

  const requestId = formData.get('request_id') as string;
  const fileName = formData.get('file_name') as string;
  const storagePath = formData.get('storage_path') as string;
  const mimeType = formData.get('mime_type') as string | null;
  const fileSizeBytes = formData.get('file_size_bytes')
    ? parseInt(formData.get('file_size_bytes') as string, 10)
    : null;
  const checklistItemId = formData.get('checklist_item_id') as string | null;

  if (!requestId || !fileName || !storagePath) {
    return {
      success: false,
      error: 'Request ID, file name, and storage path are required.',
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  // Verify the request is accessible
  const { data: req } = await supabase
    .from('procurement_requests')
    .select('id, status')
    .eq('id', requestId)
    .single();

  if (!req) {
    return { success: false, error: 'Request not found.', fieldErrors: {} };
  }

  const { data: doc, error: insertErr } = await supabase
    .from('request_documents')
    .insert({
      request_id: requestId,
      checklist_item_id: checklistItemId || null,
      uploaded_by: user.id,
      file_name: fileName,
      storage_path: storagePath,
      mime_type: mimeType || null,
      file_size_bytes: fileSizeBytes && !isNaN(fileSizeBytes) ? fileSizeBytes : null,
      status: 'uploaded' as const,
    })
    .select('id')
    .single();

  if (insertErr || !doc) {
    return {
      success: false,
      error: 'Failed to record document. Please try again.',
      fieldErrors: {},
    };
  }

  // Mark the checklist item as satisfied
  if (checklistItemId) {
    await supabase
      .from('request_checklist_items')
      .update({ status: 'satisfied', resolved_at: new Date().toISOString() })
      .eq('id', checklistItemId)
      .eq('request_id', requestId);
  }

  await logEvent({
    actor_id: user.id,
    event_type: 'document.uploaded',
    entity_type: 'request_document',
    entity_id: doc.id,
    metadata: { request_id: requestId, file_name: fileName },
  });

  return { success: true, error: null, fieldErrors: {} };
}
