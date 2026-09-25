import { requireRole } from '@/lib/auth/dal';
import { getRecentFeedback } from '@/db/support';
import { EmptyState } from '@/components/ui';

export default async function AdminFeedbackPage() {
  await requireRole('admin');
  const feedback = await getRecentFeedback();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review ratings and comments submitted on support guidance.
        </p>
      </div>
      {feedback.length === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="Submitted article feedback will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Knowledge article feedback</caption>
            <thead className="bg-slate-50">
              <tr>
                {['Article', 'Rating', 'Comment', 'Submitted By', 'Date'].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedback.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.article_title}</td>
                  <td className="px-4 py-3 text-slate-700">{item.rating ?? '—'}/5</td>
                  <td className="max-w-md px-4 py-3 text-slate-600">{item.comment || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.submitter_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
