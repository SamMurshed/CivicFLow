import type { InputHTMLAttributes } from 'react';

/**
 * Input — labelled text input with optional description and error state.
 *
 * Always renders a visible <label>. Pass `id` explicitly or it is auto-derived
 * from the `name` prop. Error messages are wired via aria-describedby.
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Helper text shown below the input */
  description?: string;
  /** Validation error message; causes red border */
  error?: string;
  /** Hide the label visually (still accessible) */
  srOnlyLabel?: boolean;
}

export default function Input({
  label,
  description,
  error,
  srOnlyLabel = false,
  id,
  name,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const ariaDescribedBy = [descId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={['text-sm font-medium text-slate-700', srOnlyLabel ? 'sr-only' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {label}
        {props.required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descId} className="text-xs text-slate-500">
          {description}
        </p>
      )}

      <input
        {...props}
        id={inputId}
        name={name}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : undefined}
        className={[
          'block w-full rounded-md border px-3 py-2 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'transition-colors',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
          error ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-slate-300 bg-white',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
