import ReportingDashboard from '@/components/reporting/ReportingDashboard';
import { requireRole } from '@/lib/auth/dal';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function value(input: string | string[] | undefined): string | undefined {
  return typeof input === 'string' && input.length > 0 ? input : undefined;
}

export default async function AdminReportingPage({ searchParams }: PageProps) {
  await requireRole('admin');
  const params = await searchParams;
  return (
    <ReportingDashboard
      pagePath="/admin/reporting"
      filters={{
        status: value(params.status),
        category: value(params.category),
        dateFrom: value(params.dateFrom),
        dateTo: value(params.dateTo),
      }}
    />
  );
}
