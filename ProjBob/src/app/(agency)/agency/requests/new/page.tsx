import { requireRole } from '@/lib/auth/dal';
import ProcurementRequestForm from '@/components/agency/ProcurementRequestForm';

export const metadata = { title: 'New Procurement Request — CivicFlow' };

export default async function NewRequestPage() {
  await requireRole('agency_user');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">New Procurement Request</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Fill in the details below. You can save a draft and submit later once all required
          documents are attached.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <ProcurementRequestForm />
      </div>
    </div>
  );
}
