import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import {
  getRequest,
  getChecklistItems,
  getRequestDocuments,
  getComments,
  getStatusHistory,
  calcChecklistCompletion,
} from '@/db/procurement-requests';
import { StatusBadge, Alert, Button } from '@/components/ui';
import SubmitRequestButton from '@/components/agency/SubmitRequestButton';
import DocumentUploadForm from '@/components/agency/DocumentUploadForm';
import CommentForm from '@/components/shared/CommentForm';
import type { RequestStatus } from '@/types/database';

interface PageProps {
  params: Promise<{ requestId: string }>;
}

const CHECKLIST_STATUS_CONFIG = {
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  satisfied: { label: 'Satisfied', classes: 'bg-emerald-100 text-emerald-700' },
  flagged: { label: 'Flagged', classes: 'bg-red-100 text-red-700' },
  waived: { label: 'Waived', classes: 'bg-slate-100 text-slate-500' },
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AgencyRequestDetailPage({ params }: PageProps) {
  const user = await requireRole('agency_user');
  const { requestId } = await params;

  const [request, checklistItems, documents, comments, statusHistory] = await Promise.all([
    getRequest(requestId),
    getChecklistItems(requestId),
    getRequestDocuments(requestId),
    getComments(requestId, false),
    getStatusHistory(requestId),
  ]);

  if (!request) notFound();

  // Authorization: agency users can only see their own org's requests
  if (request.agency_org_id !== user.organization?.id) notFound();

  const isEditable = request.status === 'draft' || request.status === 'awaiting_correction';
  const isSubmittable = isEditable;
  const isTerminal =
    request.status === 'approved' ||
    request.status === 'rejected' ||
    request.status === 'withdrawn';

  const completion = calcChecklistCompletion(checklistItems);
  const documentedItemIds = new Set(
    documents
      .filter((document) => document.status === 'uploaded' || document.status === 'accepted')
      .map((document) => document.checklist_item_id)
      .filter((id): id is string => Boolean(id)),
  );
  const pendingRequired = checklistItems.filter(
    (item) => item.is_required && !documentedItemIds.has(item.id),
  );
  const documentedRequired = checklistItems.filter(
    (item) => item.is_required && documentedItemIds.has(item.id),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link href="/agency/requests" className="text-xs text-blue-600 hover:underline">
              ← Requests
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{request.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {request.category}
            {request.agency_name ? ` · ${request.agency_name}` : ''}
            {request.submitted_at
              ? ` · Submitted ${new Date(request.submitted_at).toLocaleDateString()}`
              : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={request.status as RequestStatus} dot />
          {isEditable && (
            <Link href={`/agency/requests/${requestId}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Correction alert */}
      {request.status === 'awaiting_correction' && (
        <Alert variant="warning" title="Corrections Requested">
          An analyst has requested corrections. Please review the comments below, make any necessary
          changes, upload the required documents, and resubmit.
        </Alert>
      )}

      {/* Approved / Rejected banners */}
      {request.status === 'approved' && (
        <Alert variant="success" title="Request Approved">
          {request.decision_rationale && <span>Rationale: {request.decision_rationale}</span>}
        </Alert>
      )}
      {request.status === 'rejected' && (
        <Alert variant="error" title="Request Rejected">
          {request.decision_rationale && <span>Rationale: {request.decision_rationale}</span>}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: details + checklist + documents */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details card */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Request Details</h2>
            </div>
            <dl className="divide-y divide-slate-100">
              <div className="grid grid-cols-3 gap-4 px-5 py-3">
                <dt className="text-xs font-medium text-slate-500">Description</dt>
                <dd className="col-span-2 text-sm whitespace-pre-wrap text-slate-800">
                  {request.description}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4 px-5 py-3">
                <dt className="text-xs font-medium text-slate-500">Budget</dt>
                <dd className="col-span-2 text-sm text-slate-800">
                  ${parseFloat(request.proposed_budget).toLocaleString()}
                </dd>
              </div>
              {request.desired_start_date && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3">
                  <dt className="text-xs font-medium text-slate-500">Desired Start</dt>
                  <dd className="col-span-2 text-sm text-slate-800">
                    {new Date(request.desired_start_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {request.submission_deadline && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3">
                  <dt className="text-xs font-medium text-slate-500">Deadline</dt>
                  <dd className="col-span-2 text-sm text-slate-800">
                    {new Date(request.submission_deadline).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {request.analyst_name && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3">
                  <dt className="text-xs font-medium text-slate-500">Assigned Analyst</dt>
                  <dd className="col-span-2 text-sm text-slate-800">{request.analyst_name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Required Documents</h2>
                <span className="text-xs text-slate-500">
                  {documentedRequired}/{completion.required} documents attached
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {checklistItems.map((item) => {
                  const statusCfg =
                    CHECKLIST_STATUS_CONFIG[item.status as keyof typeof CHECKLIST_STATUS_CONFIG] ??
                    CHECKLIST_STATUS_CONFIG.pending;
                  return (
                    <li key={item.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {item.label}
                            {item.is_required && (
                              <span className="ml-1 text-red-500" aria-label="required">
                                *
                              </span>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          )}
                          {item.analyst_note && (
                            <p className="mt-1 text-xs text-amber-700">
                              Analyst note: {item.analyst_note}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}
                        >
                          {documentedItemIds.has(item.id) && item.status === 'pending'
                            ? 'Attached'
                            : statusCfg.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Documents */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Uploaded Documents ({documents.length})
              </h2>
            </div>
            {documents.length === 0 ? (
              <p className="px-5 py-6 text-center text-xs text-slate-500">
                No documents uploaded yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.mime_type}
                        {doc.file_size_bytes ? ` · ${formatBytes(doc.file_size_bytes)}` : ''}
                        {` · Uploaded ${new Date(doc.created_at).toLocaleDateString()}`}
                      </p>
                      {doc.reviewer_note && (
                        <p className="mt-1 text-xs text-amber-700">
                          Reviewer note: {doc.reviewer_note}
                        </p>
                      )}
                    </div>
                    <span
                      className={[
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                        doc.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : doc.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600',
                      ].join(' ')}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-medium text-blue-700 hover:underline"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {isEditable && (
              <div className="border-t border-slate-100 px-5 py-4">
                <DocumentUploadForm
                  requestId={requestId}
                  checklistItems={checklistItems.map((item) => ({
                    id: item.id,
                    label: item.label,
                    isRequired: item.is_required,
                  }))}
                />
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Comments ({comments.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {comments.length === 0 && (
                <p className="px-5 py-6 text-center text-xs text-slate-500">No comments yet.</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-700">
                      {comment.author_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-slate-800">{comment.body}</p>
                </div>
              ))}
            </div>
            {!isTerminal && (
              <div className="border-t border-slate-100 px-5 py-4">
                <CommentForm requestId={requestId} />
              </div>
            )}
          </div>
        </div>

        {/* Right column: actions + history */}
        <div className="space-y-6">
          {/* Submit / status actions */}
          {isSubmittable && !isTerminal && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Actions</h2>
              <SubmitRequestButton
                requestId={requestId}
                disabled={pendingRequired.length > 0}
                disabledReason={
                  pendingRequired.length > 0
                    ? `${pendingRequired.length} required checklist item${pendingRequired.length > 1 ? 's are' : ' is'} still pending.`
                    : undefined
                }
              />
            </div>
          )}

          {/* Status history */}
          {statusHistory.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">History</h2>
              </div>
              <ol className="divide-y divide-slate-100">
                {statusHistory.map((h) => (
                  <li key={h.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {h.from_status && (
                        <>
                          <StatusBadge status={h.from_status as RequestStatus} />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-3 w-3 text-slate-400"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </>
                      )}
                      <StatusBadge status={h.to_status as RequestStatus} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                    {h.reason && <p className="mt-0.5 text-xs text-slate-500 italic">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
