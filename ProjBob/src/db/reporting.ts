import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { calculateReportingMetrics } from '@/lib/analytics';
import type { ProcurementRequest } from '@/types/database';

export interface ReportingFilters {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportingRow extends ProcurementRequest {
  agency_name: string;
}

export async function getReportingData(filters: ReportingFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from('procurement_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.dateFrom) query = query.gte('submitted_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('submitted_at', `${filters.dateTo}T23:59:59.999Z`);

  const { data, error } = await query;
  if (error || !data) return { rows: [] as ReportingRow[], metrics: calculateReportingMetrics([]) };

  const agencyIds = [...new Set(data.map((request) => request.agency_org_id))];
  const { data: agencies } = agencyIds.length
    ? await supabase.from('organizations').select('id, name').in('id', agencyIds)
    : { data: [] };
  const agencyNames = new Map(
    (agencies ?? []).map((agency: { id: string; name: string }) => [agency.id, agency.name]),
  );
  const rows = data.map((request) => ({
    ...request,
    agency_name: agencyNames.get(request.agency_org_id) ?? 'Unknown agency',
  })) as ReportingRow[];

  return { rows, metrics: calculateReportingMetrics(rows) };
}
