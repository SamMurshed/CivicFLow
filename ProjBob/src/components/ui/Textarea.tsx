import type { TextareaHTMLAttributes } from 'react';

/**
 * Textarea — labelled textarea with optional description and error state.
 */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  srOnlyLabel?: boolean;
}

export default function Textarea({
  label,
  description,
  error,
  srOnlyLabel = false,
  id,
  name,
  className = '',
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descId = description ? `${textareaId}-desc` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const ariaDescribedBy =
    [descId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={textareaId}
        className={[
          'text-sm font-medium text-slate-700',
          srOnlyLabel ? 'sr-only' : '',
        ]
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

      <textarea
        {...props}
        id={textareaId}
        name={name}
        rows={rows}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : undefined}
        className={[
          'block w-full rounded-md border px-3 py-2 text-sm text-slate-900',
          'placeholder:text-slate-400 resize-y',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
          error
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-slate-300 bg-white',
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
