import { notFound } from 'next/navigation';
import { checkSupabaseHealth } from '@/lib/supabase/health';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Development-only system status page.
 *
 * Reports Supabase configuration and connectivity state without revealing
 * any secret values.  Returns 404 in production.
 */
export default async function SystemStatusPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const health = await checkSupabaseHealth();

  const rows: { label: string; value: string; ok: boolean }[] = [
    {
      label: 'NEXT_PUBLIC_SUPABASE_URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}…`
        : '(not set)',
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '(set — value hidden)' : '(not set)',
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    {
      label: 'Supabase configured',
      value: isSupabaseConfigured() ? 'Yes' : 'No',
      ok: isSupabaseConfigured(),
    },
    {
      label: 'Supabase reachable',
      value: health.reachable ? 'Yes' : health.configured ? 'No' : 'N/A — not configured',
      ok: health.reachable,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 font-sans text-slate-900">
      <h1 className="mb-2 text-2xl font-bold">System Status</h1>
      <p className="mb-8 text-sm text-slate-500">
        Development only — this page is not available in production.
      </p>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-700">Variable / Check</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Value</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.label}</td>
                <td className="px-4 py-3 text-slate-600">{row.value}</td>
                <td className="px-4 py-3">
                  {row.ok ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <span aria-hidden="true">✓</span> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <span aria-hidden="true">⚠</span> Missing
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {health.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Connectivity error:</strong> {health.error}
        </div>
      )}

      {!health.configured && (
        <p className="mt-6 text-sm text-slate-500">
          Add <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
          <code className="rounded bg-slate-100 px-1">.env.local</code> then restart the dev
          server to test connectivity.
        </p>
      )}
    </div>
  );
}
