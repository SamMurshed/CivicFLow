import { getSession } from '@/lib/auth/dal';
import { getReportingData } from '@/db/reporting';
import { rowsToCsv } from '@/lib/csv';

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return new Response('Authentication required.', { status: 401 });
  if (user.role !== 'analyst' && user.role !== 'admin') {
    return new Response('Access denied.', { status: 403 });
  }

  const url = new URL(request.url);
  const { rows } = await getReportingData({
    status: url.searchParams.get('status') || undefined,
    category: url.searchParams.get('category') || undefined,
    dateFrom: url.searchParams.get('dateFrom') || undefined,
    dateTo: url.searchParams.get('dateTo') || undefined,
  });
  const csv = rowsToCsv(
    ['Request ID', 'Title', 'Agency', 'Category', 'Status', 'Budget', 'Submitted', 'Decided'],
    rows.map((row) => [
      row.id,
      row.title,
      row.agency_name,
      row.category,
      row.status,
      row.proposed_budget,
      row.submitted_at,
      row.decided_at,
    ]),
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="civicflow-requests.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
