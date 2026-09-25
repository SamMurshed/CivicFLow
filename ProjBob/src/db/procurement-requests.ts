/**
 * Procurement Requests — database queries.
 *
 * Server-only. All queries run through the authenticated Supabase client so
 * RLS policies are enforced automatically.
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  ProcurementRequest,
  RequestChecklistItem,
  RequestDocument,
  Comment,
  ReviewAction,
  StatusHistory,
  Notification,
} from '@/types/database';

// Re-export from shared utility (pure — usable in tests/client code too)
export { calcChecklistCompletion } from '@/lib/checklist-completion';
export type { ChecklistCompletion } from '@/lib/checklist-completion';

// ─── Result shapes ────────────────────────────────────────────────────────────

export interface RequestWithMeta extends ProcurementRequest {
  agency_name: string | null;
  submitter_name: string | null;
  analyst_name: string | null;
}

export interface RequestListParams {
  /** Filter by status value */
  status?: string;
  /** Filter by category */
  category?: string;
  /** Search in title */
  search?: string;
  /** ISO date string — submitted_at >= this */
  dateFrom?: string;
  /** ISO date string — submitted_at <= this */
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface RequestListResult {
  requests: RequestWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a single request by ID with joined agency name, submitter name,
 * and assigned analyst name.  Returns null if not found or not accessible.
 */
export async function getRequest(requestId: string): Promise<RequestWithMeta | null> {
  const supabase = await createClient();

  // Supabase doesn't support multi-table joins in a single call with the JS SDK
  // so we fetch the request then the related names separately.
  const { data: req, error } = await supabase
    .from('procurement_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !req) return null;

  const [agencyResult, submitterResult, analystResult] = await Promise.all([
    req.agency_org_id
      ? supabase.from('organizations').select('name').eq('id', req.agency_org_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('profiles').select('full_name').eq('id', req.submitted_by).single(),
    req.assigned_analyst
      ? supabase.from('profiles').select('full_name').eq('id', req.assigned_analyst).single()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...req,
    agency_name: (agencyResult.data as { name: string } | null)?.name ?? null,
    submitter_name: (submitterResult.data as { full_name: string } | null)?.full_name ?? null,
    analyst_name: (analystResult.data as { full_name: string } | null)?.full_name ?? null,
  };
}

/**
 * Lists procurement requests with optional filters.
 * Uses RLS — agency users see their org's requests; analysts see the queue;
 * admins see all.
 */
export async function listRequests(params: RequestListParams = {}): Promise<RequestListResult> {
  const supabase = await createClient();
  const { status, category, search, dateFrom, dateTo, page = 1, pageSize = 20 } = params;

  let query = supabase
    .from('procurement_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('title', `%${search}%`);
  if (dateFrom) query = query.gte('submitted_at', dateFrom);
  if (dateTo) query = query.lte('submitted_at', dateTo);

  // Pagination
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;

  if (error || !data) {
    return { requests: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Enrich with agency names (batch fetch unique IDs)
  const agencyIds = [...new Set(data.map((r) => r.agency_org_id))];
  const { data: agencies } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', agencyIds);

  const agencyMap = new Map(
    (agencies ?? []).map((a: { id: string; name: string }) => [a.id, a.name]),
  );

  const requests: RequestWithMeta[] = data.map((r) => ({
    ...r,
    agency_name: agencyMap.get(r.agency_org_id) ?? null,
    submitter_name: null,
    analyst_name: null,
  }));

  const total = count ?? 0;
  return { requests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/**
 * Lists requests in the analyst review queue:
 * submitted, under_review, correction_submitted.
 */
export async function listAnalystQueue(params: RequestListParams = {}): Promise<RequestListResult> {
  const supabase = await createClient();
  const { status, category, search, dateFrom, dateTo, page = 1, pageSize = 20 } = params;

  // If status filter is set use it; otherwise show reviewable statuses
  const statusFilter = status
    ? [status]
    : ['submitted', 'under_review', 'awaiting_correction', 'correction_submitted'];

  let query = supabase
    .from('procurement_requests')
    .select('*', { count: 'exact' })
    .in('status', statusFilter)
    .order('submitted_at', { ascending: true });

  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('title', `%${search}%`);
  if (dateFrom) query = query.gte('submitted_at', dateFrom);
  if (dateTo) query = query.lte('submitted_at', dateTo);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error || !data) return { requests: [], total: 0, page, pageSize, totalPages: 0 };

  const agencyIds = [...new Set(data.map((r) => r.agency_org_id))];
  const { data: agencies } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', agencyIds);

  const agencyMap = new Map(
    (agencies ?? []).map((a: { id: string; name: string }) => [a.id, a.name]),
  );

  const requests: RequestWithMeta[] = data.map((r) => ({
    ...r,
    agency_name: agencyMap.get(r.agency_org_id) ?? null,
    submitter_name: null,
    analyst_name: null,
  }));

  const total = count ?? 0;
  return { requests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export async function getChecklistItems(requestId: string): Promise<RequestChecklistItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('request_checklist_items')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
  return (data ?? []) as RequestChecklistItem[];
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getRequestDocuments(requestId: string): Promise<RequestDocument[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('request_documents')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  return (data ?? []) as RequestDocument[];
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CommentWithAuthor extends Comment {
  author_name: string;
}

export async function getComments(
  requestId: string,
  includeInternal = false,
): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();

  let query = supabase
    .from('comments')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (!includeInternal) {
    query = query.eq('is_internal', false);
  }

  const { data } = await query;
  if (!data || data.length === 0) return [];

  // Fetch author names
  const authorIds = [...new Set(data.map((c: Comment) => c.author_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', authorIds);

  const nameMap = new Map(
    (profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]),
  );

  return (data as Comment[]).map((c) => ({
    ...c,
    author_name: nameMap.get(c.author_id) ?? 'Unknown',
  }));
}

// ─── Review actions ───────────────────────────────────────────────────────────

export async function getReviewActions(requestId: string): Promise<ReviewAction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('review_actions')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
  return (data ?? []) as ReviewAction[];
}

// ─── Status history ───────────────────────────────────────────────────────────

export async function getStatusHistory(requestId: string): Promise<StatusHistory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('status_history')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });
  return (data ?? []) as StatusHistory[];
}

// ─── Agency list (for create form) ───────────────────────────────────────────

export async function getAgencyOrganizations(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('kind', 'agency')
    .eq('is_active', true)
    .order('name');
  return (data ?? []) as { id: string; name: string }[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);
  return count ?? 0;
}

export async function getUserNotifications(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ notifications: Notification[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  const { data, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  return {
    notifications: (data ?? []) as Notification[],
    total: count ?? 0,
  };
}
