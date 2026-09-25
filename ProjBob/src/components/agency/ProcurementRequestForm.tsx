'use client';

/**
 * ProcurementRequestForm — create / edit draft form.
 *
 * Used for both the "new request" page and the edit page (isEdit = true).
 * Calls createRequest or updateRequest server actions.
 */

import { useActionState } from 'react';
import { Input, Select, Button, FormErrorSummary, Alert } from '@/components/ui';
import { PROCUREMENT_CATEGORIES, getChecklistForCategory } from '@/validation/procurement-request';
import { createRequest, updateRequest, INITIAL_STATE } from '@/lib/procurement-request-actions';
import type { ProcurementRequest } from '@/types/database';

interface ProcurementRequestFormProps {
  /** When provided, renders in edit mode */
  request?: ProcurementRequest;
}

const CATEGORY_OPTIONS = PROCUREMENT_CATEGORIES.map((c) => ({ value: c, label: c }));

export default function ProcurementRequestForm({ request }: ProcurementRequestFormProps) {
  const isEdit = Boolean(request);
  const action = isEdit ? updateRequest : createRequest;

  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const selectedCategory = request?.category;
  const checklist = selectedCategory ? getChecklistForCategory(selectedCategory) : null;

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="request_id" value={request!.id} />}

      {state.error && !Object.keys(state.fieldErrors ?? {}).length && (
        <Alert variant="error" title="Error">
          {state.error}
        </Alert>
      )}

      {state.error && Object.keys(state.fieldErrors ?? {}).length > 0 && (
        <FormErrorSummary
          heading="Please correct the following errors"
          errors={state.fieldErrors ?? {}}
        />
      )}

      {state.success && (
        <Alert variant="success" title="Saved">
          Request saved successfully.
        </Alert>
      )}

      <Input
        label="Title"
        name="title"
        id="title"
        required
        defaultValue={request?.title ?? ''}
        error={state.fieldErrors?.title}
        placeholder="e.g. Network Infrastructure Upgrade"
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          Description
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={request?.description ?? ''}
          placeholder="Describe the procurement need, objectives, and any special requirements."
          className={[
            'block w-full rounded-md border px-3 py-2 text-sm text-slate-900',
            'transition-colors placeholder:text-slate-400',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none',
            state.fieldErrors?.description
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 bg-white',
          ].join(' ')}
        />
        {state.fieldErrors?.description && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {state.fieldErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Category"
          name="category"
          id="category"
          required
          defaultValue={request?.category ?? ''}
          options={CATEGORY_OPTIONS}
          placeholder="Select a category…"
          error={state.fieldErrors?.category}
          description="The category determines which documents will be required."
        />

        <Input
          label="Proposed Budget (USD)"
          name="proposed_budget"
          id="proposed_budget"
          type="text"
          inputMode="decimal"
          required
          defaultValue={request?.proposed_budget ?? ''}
          error={state.fieldErrors?.proposed_budget}
          placeholder="e.g. 50000.00"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Desired Start Date"
          name="desired_start_date"
          id="desired_start_date"
          type="date"
          defaultValue={request?.desired_start_date ?? ''}
          error={state.fieldErrors?.desired_start_date}
        />
        <Input
          label="Submission Deadline"
          name="submission_deadline"
          id="submission_deadline"
          type="date"
          defaultValue={request?.submission_deadline ?? ''}
          error={state.fieldErrors?.submission_deadline}
        />
      </div>

      {/* Required documents preview */}
      {checklist && checklist.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-blue-800 uppercase">
            Required documents for this category
          </p>
          <ul className="space-y-1">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-2 text-xs text-blue-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span>
                  <strong>{item.label}</strong> — {item.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={isPending} disabled={isPending}>
          {isEdit ? 'Save Changes' : 'Create Request'}
        </Button>
      </div>
    </form>
  );
}
