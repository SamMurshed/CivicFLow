import Link from 'next/link';

const roles = [
  {
    title: 'Vendor',
    description: 'Submit documents, respond to corrections, and track request status.',
  },
  {
    title: 'Agency User',
    description:
      'Create procurement requests, select vendors, and supply project and budget details.',
  },
  {
    title: 'Procurement Analyst',
    description: 'Review submissions, request corrections, and approve or reject requests.',
  },
  {
    title: 'Administrator',
    description:
      'Manage organizations, users, checklist templates, and system-wide reporting.',
  },
];

const steps = [
  {
    number: 1,
    label: 'Submit',
    description: 'Agency users create a procurement request and select a vendor.',
  },
  {
    number: 2,
    label: 'Review',
    description: 'Procurement analysts check submitted information against requirements.',
  },
  {
    number: 3,
    label: 'Correct',
    description: 'Analysts request corrections; vendors and agency users respond.',
  },
  {
    number: 4,
    label: 'Approve',
    description: 'Analysts approve or reject the completed submission.',
  },
  {
    number: 5,
    label: 'Report',
    description: 'Administrators and analysts access reports and audit trails.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold tracking-tight text-slate-900">CivicFlow</span>
          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-3">
              <li>
                <Link
                  href="/sign-in"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/demo"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  View Demo
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section aria-labelledby="hero-heading" className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h1
              id="hero-heading"
              className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
            >
              Streamline Public Procurement, End to End
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              CivicFlow is a procurement operations platform built for the public sector. It
              connects vendors, agency users, and procurement analysts in a single, structured
              workflow — from request creation through document review and final approval.
              Every step is tracked, auditable, and accessible to the right stakeholders.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/sign-in"
                className="w-full rounded-md border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                Sign In
              </Link>
              <Link
                href="/demo"
                className="w-full rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
              >
                View Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section
          aria-labelledby="roles-heading"
          className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2
              id="roles-heading"
              className="mb-10 text-center text-3xl font-bold tracking-tight text-slate-900"
            >
              Who Uses CivicFlow
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => (
                <article
                  key={role.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{role.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{role.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section
          aria-labelledby="workflow-heading"
          className="border-t border-slate-200 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2
              id="workflow-heading"
              className="mb-10 text-center text-3xl font-bold tracking-tight text-slate-900"
            >
              How It Works
            </h2>
            <ol className="flex flex-col gap-6 lg:flex-row lg:gap-0">
              {steps.map((step, index) => (
                <li key={step.number} className="relative flex flex-1 flex-col items-center">
                  {/* Connector line between steps (desktop only) */}
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[calc(50%+2rem)] top-5 hidden h-px w-[calc(100%-4rem)] bg-slate-200 lg:block"
                    />
                  )}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {step.number}
                  </div>
                  <div className="mt-4 max-w-[180px] text-center">
                    <p className="text-base font-semibold text-slate-900">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © 2025 CivicFlow. Fictional platform for demonstration purposes only.
        </div>
      </footer>
    </div>
  );
}
