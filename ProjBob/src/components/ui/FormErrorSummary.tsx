/**
 * FormErrorSummary — displays all form validation errors in a grouped list.
 *
 * Meets WCAG 2.1 SC 3.3.1: on submit, a summary is shown at the top of the
 * form and announced via role="alert". Each error is a link that moves focus
 * to the offending field.
 */

interface FormErrorSummaryProps {
  errors: Record<string, string | undefined>;
  /** A human-readable heading */
  heading?: string;
}

export default function FormErrorSummary({
  errors,
  heading = 'Please correct the following errors:',
}: FormErrorSummaryProps) {
  const entries = Object.entries(errors).filter(([, v]) => Boolean(v));

  if (entries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      tabIndex={-1}
    >
      <p className="font-semibold">{heading}</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#${field}`}
              className="underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
