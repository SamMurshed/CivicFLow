import type { SelectHTMLAttributes } from 'react';

/**
 * Select — labelled <select> with optional description and error state.
 */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  error?: string;
  srOnlyLabel?: boolean;
}

export default function Select({
  label,
  options,
  placeholder,
  description,
  error,
  srOnlyLabel = false,
  id,
  name,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descId = description ? `${selectId}-desc` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const ariaDescribedBy = [descId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
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

      <select
        {...props}
        id={selectId}
        name={name}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : undefined}
        className={[
          'block w-full rounded-md border px-3 py-2 text-sm text-slate-900',
          'appearance-none bg-white transition-colors',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
          error ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-slate-300',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.625rem center',
          backgroundSize: '1.25rem',
          paddingRight: '2.5rem',
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
