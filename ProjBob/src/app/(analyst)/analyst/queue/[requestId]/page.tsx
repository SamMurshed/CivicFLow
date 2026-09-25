import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/dal';
import {
  getRequest,
  getChecklistItems,
  getRequestDocuments,
  getComments,
  getReviewActions,
  getStatusHistory,
  calcChecklistCompletion,
} from '@/db/procurement-requests';
import { StatusBadge } from '@/components/ui';
import ReviewDecisionForm from '@/components/analyst/ReviewDecisionForm';
import StartReviewButton from '@/components/analyst/StartReviewButton';
import ChecklistReviewForm from '@/components/analyst/ChecklistReviewForm';
import DocumentReviewForm from '@/components/analyst/DocumentReviewForm';
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

const DECISION_LABELS: Record<string, string> = {
  approve: 'Approved',
  reject: 'Rejected',
  request_correction: 'Corrections Requested',
  place_on_hold: 'Placed on Hold',
  resume_from_hold: 'Resumed from Hold',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AnalystQueueDetailPage({ params }: PageProps) {
  const user = await requireRole('analyst', 'admin');
  const { requestId } = await params;

  const [request, checklistItems, documents, comments, reviewActions, statusHistory] =
    await Promise.all([
      getRequest(requestId),
      getChecklistItems(requestId),
      getRequestDocuments(requestId),
      getComments(requestId, true), // include internal
      getReviewActions(requestId),
      getStatusHistory(requestId),
    ]);

  if (!request) notFound();

  const isTerminal =
    request.status === 'approved' ||
    request.status === 'rejected' ||
    request.status === 'withdrawn';

  const completion = calcChecklistCompletion(checklistItems);
  const canStartReview =
    request.status === 'submitted' || request.status === 'correction_submitted';
  const canReview = request.status === 'under_review' || request.status === 'on_hold';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1">
            <Link href="/analyst/queue" className="text-xs text-blue-600 hover:underline">
              ← Review Queue
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{request.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {request.agency_name ?? 'Unknown agency'} · {request.category}
            {request.submitted_at
              ? ` · Submitted ${new Date(request.submitted_at).toLocaleDateString()}`
              : ''}
          </p>
        </div>
        <StatusBadge status={request.status as RequestStatus} dot />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: request details + checklist + documents + comments */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
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
              <div className="grid grid-cols-3 gap-4 px-5 py-3">
                <dt className="text-xs font-medium text-slate-500">Submitted By</dt>
                <dd className="col-span-2 text-sm text-slate-800">
                  {request.submitter_name ?? '—'}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-4 px-5 py-3">
                <dt className="text-xs font-medium text-slate-500">Assigned Analyst</dt>
                <dd className="col-span-2 text-sm text-slate-800">
                  {request.analyst_name ?? '—'}
                  {request.assigned_analyst === user.id && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      You
                    </span>
                  )}
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
              {request.decided_at && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3">
                  <dt className="text-xs font-medium text-slate-500">Decided</dt>
                  <dd className="col-span-2 text-sm text-slate-800">
                    {new Date(request.decided_at).toLocaleString()}
                  </dd>
                </div>
              )}
              {request.decision_rationale && (
                <div className="grid grid-cols-3 gap-4 px-5 py-3">
                  <dt className="text-xs font-medium text-slate-500">Rationale</dt>
                  <dd className="col-span-2 text-sm text-slate-800 italic">
                    {request.decision_rationale}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Document Checklist</h2>
                <span
                  className={[
                    'text-xs font-medium',
                    completion.allRequiredMet ? 'text-emerald-600' : 'text-amber-600',
                  ].join(' ')}
                >
                  {completion.requiredSatisfied}/{completion.required} required met
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
                            <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                              Note: {item.analyst_note}
                            </p>
                          )}
                          {canReview && (
                            <ChecklistReviewForm
                              requestId={requestId}
                              itemId={item.id}
                              currentStatus={item.status}
                              currentNote={item.analyst_note}
                            />
                          )}
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.classes}`}
                        >
                          {statusCfg.label}
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
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.mime_type}
                        {doc.file_size_bytes ? ` · ${formatBytes(doc.file_size_bytes)}` : ''}
                        {` · Uploaded ${new Date(doc.created_at).toLocaleDateString()}`}
                      </p>
                      {doc.reviewer_note && (
                        <p className="mt-1 text-xs text-amber-700">Note: {doc.reviewer_note}</p>
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
                    {request.status === 'under_review' && (
                      <div className="w-full basis-full">
                        <DocumentReviewForm
                          requestId={requestId}
                          documentId={doc.id}
                          currentStatus={doc.status}
                          currentNote={doc.reviewer_note}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments (including internal) */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Comments ({comments.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {comments.length === 0 && (
                <p className="px-5 py-6 text-center text-xs text-slate-500">No comments yet.</p>
              )}
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={['px-5 py-4', comment.is_internal ? 'bg-violet-50' : ''].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        {comment.author_name}
                      </span>
                      {comment.is_internal && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          Internal
                        </span>
                      )}
                    </div>
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
                <CommentForm
                  requestId={requestId}
                  allowInternal
                  placeholder="Add a comment or internal note…"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: decision panel + history */}
        <div className="space-y-6">
          {/* Review decision */}
          {canStartReview && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Begin Review</h2>
              <p className="mb-4 text-xs text-slate-600">
                Claim this request and move it into active review before recording findings.
              </p>
              <StartReviewButton requestId={requestId} />
            </div>
          )}

          {canReview && !isTerminal && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Review Decision</h2>
              <ReviewDecisionForm
                requestId={requestId}
                currentStatus={request.status as RequestStatus}
              />
            </div>
          )}

          {/* Terminal banner */}
          {isTerminal && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <p className="text-xs text-slate-500">
                This request has been{' '}
                <strong>{request.status === 'withdrawn' ? 'withdrawn' : 'decided'}</strong>. No
                further actions are available.
              </p>
            </div>
          )}

          {/* Prior review actions */}
          {reviewActions.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Review History</h2>
              </div>
              <ol className="divide-y divide-slate-100">
                {reviewActions.map((action) => (
                  <li key={action.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        {DECISION_LABELS[action.decision] ?? action.decision}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(action.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {action.note && (
                      <p className="mt-1 text-xs text-slate-600 italic">{action.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Full status history / audit trail */}
          {statusHistory.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Audit Trail</h2>
              </div>
              <ol className="divide-y divide-slate-100">
                {statusHistory.map((h) => (
                  <li key={h.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {h.from_status && (
                        <>
                          <StatusBadge status={h.from_status as RequestStatus} />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-3 w-3 shrink-0 text-slate-400"
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
