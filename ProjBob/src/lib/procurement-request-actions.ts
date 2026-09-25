'use server';

/**
 * Procurement Request — Server Actions
 *
 * createRequest    — agency user creates a draft
 * updateRequest    — agency user edits a draft or correction-pending request
 * submitRequest    — agency user submits a draft for review
 * withdrawRequest  — agency user withdraws a submitted/active request
 *
 * All mutations:
 *   • Enforce server-side role + ownership authorization.
 *   • Validate input with Zod.
 *   • Write a status_history entry and activity_log entry on status changes.
 *   • Are idempotent where practical (upsert semantics on draft save).
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { logEvent } from '@/lib/activity-log';
import { notify } from '@/lib/notifications';
import {
  procurementRequestSchema,
  getChecklistForCategory,
  getSubmissionTargetStatus,
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
  reason?: string,
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

// ─── createRequest ────────────────────────────────────────────────────────────

/**
 * Creates a new procurement request as a draft.
 * On success redirects to the edit/detail page.
 */
export async function createRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user');

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    proposed_budget: formData.get('proposed_budget'),
    desired_start_date: formData.get('desired_start_date') || null,
    submission_deadline: formData.get('submission_deadline') || null,
    agency_org_id: user.organization?.id ?? '',
  };

  const parsed = procurementRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: 'Please correct the errors below.', fieldErrors };
  }

  if (!user.organization || user.organization.kind !== 'agency') {
    return {
      success: false,
      error: 'Your account is not associated with an agency organisation.',
      fieldErrors: {},
    };
  }

  const supabase = await createClient();

  const { data: req, error } = await supabase
    .from('procurement_requests')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      proposed_budget: parsed.data.proposed_budget,
      desired_start_date: parsed.data.desired_start_date,
      submission_deadline: parsed.data.submission_deadline,
      agency_org_id: parsed.data.agency_org_id,
      submitted_by: user.id,
      status: 'draft' as RequestStatus,
    })
    .select('id')
    .single();

  if (error || !req) {
    return {
      success: false,
      error: 'Failed to create request. Please try again.',
      fieldErrors: {},
    };
  }

  // Seed the checklist from category template
  const items = getChecklistForCategory(parsed.data.category);
  if (items.length > 0) {
    await supabase.from('request_checklist_items').insert(
      items.map((item, i) => ({
        request_id: req.id,
        item_key: item.key,
        label: item.label,
        description: item.description,
        is_required: true,
        status: 'pending' as const,
        sort_order: i,
      })),
    );
  }

  // Record initial status history
  await recordStatusTransition(req.id, user.id, null, 'draft');

  await logEvent({
    actor_id: user.id,
    event_type: 'procurement_request.created',
    entity_type: 'procurement_request',
    entity_id: req.id,
    metadata: { category: parsed.data.category },
  });

  redirect(`/agency/requests/${req.id}`);
}

// ─── updateRequest ────────────────────────────────────────────────────────────

/**
 * Updates an existing draft or awaiting-correction request.
 */
export async function updateRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user');

  const requestId = formData.get('request_id') as string;
  if (!requestId) {
    return { success: false, error: 'Request ID is required.', fieldErrors: {} };
  }

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    proposed_budget: formData.get('proposed_budget'),
    desired_start_date: formData.get('desired_start_date') || null,
    submission_deadline: formData.get('submission_deadline') || null,
    agency_org_id: user.organization?.id ?? '',
  };

  const parsed = procurementRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string | undefined> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: 'Please correct the errors below.', fieldErrors };
  }

  const supabase = await createClient();

  // Fetch the request to verify ownership and status
  const { data: existing, error: fetchErr } = await supabase
    .from('procurement_requests')
    .select('id, status, agency_org_id, submitted_by, category')
    .eq('id', requestId)
    .single();

  if (fetchErr || !existing) {
    return { success: false, error: 'Request not found.', fieldErrors: {} };
  }

  // Authorization: must be agency owner and editable status
  if (
    existing.agency_org_id !== user.organization?.id ||
    !['draft', 'awaiting_correction'].includes(existing.status)
  ) {
    return {
      success: false,
      error: 'You are not allowed to edit this request.',
      fieldErrors: {},
    };
  }

  const { error: updateErr } = await supabase
    .from('procurement_requests')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      proposed_budget: parsed.data.proposed_budget,
      desired_start_date: parsed.data.desired_start_date,
      submission_deadline: parsed.data.submission_deadline,
    })
    .eq('id', requestId);

  if (updateErr) {
    return { success: false, error: 'Failed to save request. Please try again.', fieldErrors: {} };
  }

  // If category changed, replace checklist items
  if (existing.category !== parsed.data.category) {
    await supabase.from('request_checklist_items').delete().eq('request_id', requestId);
    const items = getChecklistForCategory(parsed.data.category);
    if (items.length > 0) {
      await supabase.from('request_checklist_items').insert(
        items.map((item, i) => ({
          request_id: requestId,
          item_key: item.key,
          label: item.label,
          description: item.description,
          is_required: true,
          status: 'pending' as const,
          sort_order: i,
        })),
      );
    }
  }

  await logEvent({
    actor_id: user.id,
    event_type: 'procurement_request.updated',
    entity_type: 'procurement_request',
    entity_id: requestId,
  });

  revalidatePath(`/agency/requests/${requestId}`);

  return { success: true, error: null, fieldErrors: {} };
}

// ─── submitRequest ────────────────────────────────────────────────────────────

/**
 * Submits a draft or correction-pending request for analyst review.
 * Blocks if any required checklist item has no current document attached.
 */
export async function submitRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user');

  const requestId = formData.get('request_id') as string;
  if (!requestId) {
    return { success: false, error: 'Request ID is required.', fieldErrors: {} };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('procurement_requests')
    .select('id, status, agency_org_id, submitted_by, title, assigned_analyst')
    .eq('id', requestId)
    .single();

  if (fetchErr || !existing) {
    return { success: false, error: 'Request not found.', fieldErrors: {} };
  }

  if (existing.agency_org_id !== user.organization?.id) {
    return { success: false, error: 'Access denied.', fieldErrors: {} };
  }

  const allowedFromStatuses: RequestStatus[] = ['draft', 'awaiting_correction'];
  if (!allowedFromStatuses.includes(existing.status as RequestStatus)) {
    return {
      success: false,
      error: `This request cannot be submitted from the "${existing.status}" status.`,
      fieldErrors: {},
    };
  }

  const [{ data: checklistItems }, { data: documents }] = await Promise.all([
    supabase.from('request_checklist_items').select('id, is_required').eq('request_id', requestId),
    supabase
      .from('request_documents')
      .select('checklist_item_id, status')
      .eq('request_id', requestId)
      .in('status', ['uploaded', 'accepted']),
  ]);

  const documentedItemIds = new Set(
    (documents ?? [])
      .map((document: { checklist_item_id: string | null }) => document.checklist_item_id)
      .filter((id): id is string => Boolean(id)),
  );
  const missingRequired = (checklistItems ?? []).filter(
    (item: { id: string; is_required: boolean }) =>
      item.is_required && !documentedItemIds.has(item.id),
  );

  if (missingRequired.length > 0) {
    return {
      success: false,
      error: `${missingRequired.length} required document${missingRequired.length > 1 ? 's are' : ' is'} still missing. Attach a document to every required checklist item before submitting.`,
      fieldErrors: {},
    };
  }

  const fromStatus = existing.status as RequestStatus;
  const targetStatus = getSubmissionTargetStatus(fromStatus);

  const { error: updateErr } = await supabase
    .from('procurement_requests')
    .update({
      status: targetStatus,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateErr) {
    return {
      success: false,
      error: 'Failed to submit request. Please try again.',
      fieldErrors: {},
    };
  }

  await recordStatusTransition(requestId, user.id, fromStatus, targetStatus);

  await logEvent({
    actor_id: user.id,
    event_type: 'procurement_request.submitted',
    entity_type: 'procurement_request',
    entity_id: requestId,
    metadata: { from_status: fromStatus, to_status: targetStatus },
  });

  // Notify assigned analyst if any
  if (existing.assigned_analyst) {
    await notify({
      recipient_id: existing.assigned_analyst,
      request_id: requestId,
      title: 'Request submitted for review',
      body: `"${existing.title}" has been submitted and is ready for review.`,
      link: `/analyst/queue/${requestId}`,
    });
  }

  redirect(`/agency/requests/${requestId}`);
}

// ─── withdrawRequest ──────────────────────────────────────────────────────────

/**
 * Withdraws a submitted / under-review request.  Draft requests can just be
 * deleted, so withdrawal only applies to non-draft submitted requests.
 */
export async function withdrawRequest(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('agency_user');

  const requestId = formData.get('request_id') as string;
  if (!requestId) {
    return { success: false, error: 'Request ID is required.', fieldErrors: {} };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchErr } = await supabase
    .from('procurement_requests')
    .select('id, status, agency_org_id, assigned_analyst, title')
    .eq('id', requestId)
    .single();

  if (fetchErr || !existing) {
    return { success: false, error: 'Request not found.', fieldErrors: {} };
  }

  if (existing.agency_org_id !== user.organization?.id) {
    return { success: false, error: 'Access denied.', fieldErrors: {} };
  }

  const withdrawableStatuses: RequestStatus[] = [
    'submitted',
    'under_review',
    'awaiting_correction',
  ];
  if (!withdrawableStatuses.includes(existing.status as RequestStatus)) {
    return {
      success: false,
      error: 'This request cannot be withdrawn from its current status.',
      fieldErrors: {},
    };
  }

  const fromStatus = existing.status as RequestStatus;

  const { error: updateErr } = await supabase
    .from('procurement_requests')
    .update({ status: 'withdrawn' as RequestStatus })
    .eq('id', requestId);

  if (updateErr) {
    return {
      success: false,
      error: 'Failed to withdraw request. Please try again.',
      fieldErrors: {},
    };
  }

  await recordStatusTransition(
    requestId,
    user.id,
    fromStatus,
    'withdrawn',
    'Withdrawn by applicant',
  );

  await logEvent({
    actor_id: user.id,
    event_type: 'procurement_request.withdrawn',
    entity_type: 'procurement_request',
    entity_id: requestId,
  });

  revalidatePath(`/agency/requests/${requestId}`);
  revalidatePath('/agency/requests');

  return { success: true, error: null, fieldErrors: {} };
}
