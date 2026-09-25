/**
 * Dashboard counts helper.
 *
 * Returns real counts from the database via the authenticated Supabase client.
 * RLS ensures each role only counts their own records.
 */
import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface VendorDashboardCounts {
  activeRequests: number;
  awaitingCorrection: number;
  documentsUploaded: number;
  unreadNotifications: number;
}

export interface AgencyDashboardCounts {
  draftRequests: number;
  submittedRequests: number;
  activeRequests: number;
  awaitingCorrectionRequests: number;
}

export interface AnalystDashboardCounts {
  reviewQueue: number;
  underReview: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
}

export interface AdminDashboardCounts {
  totalRequests: number;
  activeOrganisations: number;
  totalUsers: number;
  openOnHold: number;
}

// ─── Vendor ──────────────────────────────────────────────────────────────────

export async function getVendorDashboardCounts(userId: string): Promise<VendorDashboardCounts> {
  const supabase = await createClient();

  const [activeRes, correctionRes, docsRes, notifRes] = await Promise.all([
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review', 'correction_submitted']),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'awaiting_correction'),
    supabase
      .from('request_documents')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', userId),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false),
  ]);

  return {
    activeRequests: activeRes.count ?? 0,
    awaitingCorrection: correctionRes.count ?? 0,
    documentsUploaded: docsRes.count ?? 0,
    unreadNotifications: notifRes.count ?? 0,
  };
}

// ─── Agency ───────────────────────────────────────────────────────────────────

export async function getAgencyDashboardCounts(): Promise<AgencyDashboardCounts> {
  const supabase = await createClient();

  const [draftRes, submittedRes, activeRes, correctionRes] = await Promise.all([
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['under_review', 'correction_submitted', 'on_hold']),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'awaiting_correction'),
  ]);

  return {
    draftRequests: draftRes.count ?? 0,
    submittedRequests: submittedRes.count ?? 0,
    activeRequests: activeRes.count ?? 0,
    awaitingCorrectionRequests: correctionRes.count ?? 0,
  };
}

// ─── Analyst ──────────────────────────────────────────────────────────────────

export async function getAnalystDashboardCounts(): Promise<AnalystDashboardCounts> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [queueRes, reviewRes, approvedRes, rejectedRes] = await Promise.all([
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'correction_submitted']),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'under_review'),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('decided_at', startOfMonth.toISOString()),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .gte('decided_at', startOfMonth.toISOString()),
  ]);

  return {
    reviewQueue: queueRes.count ?? 0,
    underReview: reviewRes.count ?? 0,
    approvedThisMonth: approvedRes.count ?? 0,
    rejectedThisMonth: rejectedRes.count ?? 0,
  };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminDashboardCounts(): Promise<AdminDashboardCounts> {
  const supabase = await createClient();

  const [reqRes, orgRes, userRes, holdRes] = await Promise.all([
    supabase.from('procurement_requests').select('*', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('procurement_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'on_hold'),
  ]);

  return {
    totalRequests: reqRes.count ?? 0,
    activeOrganisations: orgRes.count ?? 0,
    totalUsers: userRes.count ?? 0,
    openOnHold: holdRes.count ?? 0,
  };
}
