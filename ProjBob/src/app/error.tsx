'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-red-700">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        CivicFlow could not complete that request.
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        No changes were intentionally discarded. Try the action again, or return to your dashboard.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
