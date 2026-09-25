import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import { getRequest } from '@/db/procurement-requests';
import ProcurementRequestForm from '@/components/agency/ProcurementRequestForm';

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function EditRequestPage({ params }: PageProps) {
  const user = await requireRole('agency_user');
  const { requestId } = await params;

  const request = await getRequest(requestId);
  if (!request) notFound();

  // Authorization: only the owning agency can edit
  if (request.agency_org_id !== user.organization?.id) notFound();

  // Only draft and awaiting_correction are editable
  if (request.status !== 'draft' && request.status !== 'awaiting_correction') {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Edit Request</h1>
        <p className="mt-0.5 truncate text-sm text-slate-500">{request.title}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <ProcurementRequestForm request={request} />
      </div>
    </div>
  );
}
