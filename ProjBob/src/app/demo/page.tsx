import Link from 'next/link';

const roles = [
  {
    role: 'Agency User',
    path: '/agency/dashboard',
    focus: 'Create requests, attach documents, and respond to corrections.',
  },
  {
    role: 'Procurement Analyst',
    path: '/analyst/dashboard',
    focus: 'Review documents, record checklist findings, and decide requests.',
  },
  {
    role: 'Administrator',
    path: '/admin/dashboard',
    focus: 'View system reporting, guidance feedback, and operational totals.',
  },
  {
    role: 'Vendor',
    path: '/vendor/dashboard',
    focus: 'Maintain a vendor profile and view role-specific guidance.',
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
            ← CivicFlow home
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Explore the CivicFlow Demo</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            CivicFlow contains only fictional organizations, people, requests, budgets, and
            documents. A configured deployment provides separate accounts for each role.
          </p>
        </div>
        <section className="grid gap-4 sm:grid-cols-2" aria-labelledby="demo-roles">
          <h2 id="demo-roles" className="sr-only">
            Demo roles
          </h2>
          {roles.map((item) => (
            <article
              key={item.role}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{item.role}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.focus}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">Landing route: {item.path}</p>
            </article>
          ))}
        </section>
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-slate-900">Recommended walkthrough</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Create and document an agency request.</li>
            <li>Claim it from the analyst queue and review each requirement.</li>
            <li>Request and resubmit a correction, then record a final decision.</li>
            <li>Review reporting metrics and export the filtered CSV.</li>
          </ol>
        </section>
        <Link
          href="/sign-in"
          className="inline-flex rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Continue to sign in
        </Link>
      </div>
    </main>
  );
}
