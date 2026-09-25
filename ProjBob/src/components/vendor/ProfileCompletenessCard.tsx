/**
 * ProfileCompletenessCard — shows how complete the vendor's profile is and
 * lists the missing required fields.
 *
 * Client component because it renders progress bar fill inline.
 */
'use client';

import type { CompletenessResult } from '@/lib/vendor-profile-completeness';
import Link from 'next/link';

interface Props {
  result: CompletenessResult;
  editHref?: string;
}

export default function ProfileCompletenessCard({ result, editHref }: Props) {
  const { percent, missingFields } = result;

  const barColor = percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Profile Completeness</h2>
        <span className="text-sm font-semibold text-slate-700">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profile ${percent}% complete`}
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {percent < 100 && missingFields.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-600">Missing required fields:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {missingFields.map((field) => (
              <li key={field} className="text-xs text-slate-500">
                {field}
              </li>
            ))}
          </ul>
          {editHref && (
            <Link
              href={editHref}
              className="mt-3 inline-block text-xs font-medium text-blue-600 underline hover:no-underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              Complete your profile →
            </Link>
          )}
        </div>
      )}

      {percent === 100 && (
        <p className="mt-2 text-xs font-medium text-emerald-600">✓ Profile complete</p>
      )}
    </div>
  );
}
