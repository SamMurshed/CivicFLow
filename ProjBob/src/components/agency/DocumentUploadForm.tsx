'use client';

import { FormEvent, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_STATE, recordDocumentUpload, type ActionState } from '@/lib/review-actions';

interface ChecklistOption {
  id: string;
  label: string;
  isRequired: boolean;
}

interface Props {
  requestId: string;
  checklistItems: ChecklistOption[];
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export default function DocumentUploadForm({ requestId, checklistItems }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>(INITIAL_STATE);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file');
    const checklistItemId = String(formData.get('checklist_item_id') ?? '');

    if (!(file instanceof File) || file.size === 0 || !checklistItemId) {
      setState({ success: false, error: 'Choose a checklist item and file.', fieldErrors: {} });
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setState({ success: false, error: 'Upload a PDF, DOCX, JPG, or PNG file.', fieldErrors: {} });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setState({ success: false, error: 'The file must be 10 MB or smaller.', fieldErrors: {} });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
      const storagePath = `${requestId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('request-documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setState({ success: false, error: uploadError.message, fieldErrors: {} });
        return;
      }

      const metadata = new FormData();
      metadata.set('request_id', requestId);
      metadata.set('checklist_item_id', checklistItemId);
      metadata.set('file_name', file.name);
      metadata.set('storage_path', storagePath);
      metadata.set('mime_type', file.type);
      metadata.set('file_size_bytes', String(file.size));
      const result = await recordDocumentUpload(INITIAL_STATE, metadata);

      if (!result.success) {
        await supabase.storage.from('request-documents').remove([storagePath]);
        setState(result);
        return;
      }

      setState(result);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      {state.success && (
        <Alert variant="success" title="Document uploaded">
          The file is attached and ready for analyst review.
        </Alert>
      )}
      {state.error && (
        <Alert variant="error" title="Upload failed">
          {state.error}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Checklist item
          <select
            name="checklist_item_id"
            required
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select requirement…</option>
            {checklistItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
                {item.isRequired ? ' (required)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          File
          <input
            name="file"
            type="file"
            required
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1"
          />
        </label>
        <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
          Upload
        </Button>
      </div>
      <p className="text-xs text-slate-500">PDF, DOCX, JPG, or PNG; maximum 10 MB.</p>
    </form>
  );
}
