/**
 * Procurement Request — Zod validation schemas.
 *
 * Covers:
 *   • procurementRequestSchema — create / edit draft form
 *   • reviewActionSchema       — analyst review decision
 *   • commentSchema            — post a comment
 */

import { z } from 'zod';

// ─── Categories ───────────────────────────────────────────────────────────────

export const PROCUREMENT_CATEGORIES = [
  'Information Technology',
  'Professional Services',
  'Construction & Engineering',
  'Office Supplies & Furniture',
  'Healthcare & Medical Supplies',
  'Food & Beverage',
  'Facilities Management',
  'Transportation & Logistics',
  'Environmental Services',
  'Marketing & Communications',
  'Legal Services',
  'Financial Services',
  'Educational Services',
  'Security Services',
  'Other',
] as const;

export type ProcurementCategory = (typeof PROCUREMENT_CATEGORIES)[number];

// ─── Category → required document checklist items ────────────────────────────

export const CATEGORY_CHECKLIST: Record<
  string,
  Array<{ key: string; label: string; description: string }>
> = {
  'Information Technology': [
    {
      key: 'scope_of_work',
      label: 'Scope of Work',
      description: 'Detailed description of the IT work required.',
    },
    {
      key: 'technical_specs',
      label: 'Technical Specifications',
      description: 'Hardware/software requirements and standards.',
    },
    {
      key: 'security_requirements',
      label: 'Security Requirements',
      description: 'Data classification and security controls needed.',
    },
    {
      key: 'budget_justification',
      label: 'Budget Justification',
      description: 'Cost breakdown and pricing rationale.',
    },
  ],
  'Professional Services': [
    {
      key: 'scope_of_work',
      label: 'Scope of Work',
      description: 'Description of the professional services required.',
    },
    {
      key: 'qualifications',
      label: 'Vendor Qualifications',
      description: 'Required certifications, licences, or credentials.',
    },
    {
      key: 'budget_justification',
      label: 'Budget Justification',
      description: 'Fee schedule and cost justification.',
    },
    {
      key: 'timeline',
      label: 'Project Timeline',
      description: 'Proposed milestones and delivery schedule.',
    },
  ],
  'Construction & Engineering': [
    {
      key: 'scope_of_work',
      label: 'Scope of Work',
      description: 'Detailed construction or engineering requirements.',
    },
    {
      key: 'site_plans',
      label: 'Site Plans / Drawings',
      description: 'Architectural or engineering drawings.',
    },
    {
      key: 'permits',
      label: 'Permits & Approvals',
      description: 'List of required permits and regulatory approvals.',
    },
    {
      key: 'budget_justification',
      label: 'Budget Justification',
      description: 'Cost estimate with material and labour breakdown.',
    },
    {
      key: 'insurance',
      label: 'Insurance Requirements',
      description: 'Required coverage types and minimums.',
    },
  ],
  'Healthcare & Medical Supplies': [
    {
      key: 'scope_of_work',
      label: 'Scope of Work',
      description: 'Description of medical supplies or services needed.',
    },
    {
      key: 'compliance',
      label: 'Regulatory Compliance',
      description: 'FDA clearances and applicable compliance standards.',
    },
    {
      key: 'budget_justification',
      label: 'Budget Justification',
      description: 'Unit pricing and total cost estimate.',
    },
  ],
  default: [
    {
      key: 'scope_of_work',
      label: 'Scope of Work',
      description: 'Clear description of what is being procured.',
    },
    {
      key: 'budget_justification',
      label: 'Budget Justification',
      description: 'Cost estimate and justification.',
    },
  ],
};

/** Returns checklist template items for the given category */
export function getChecklistForCategory(
  category: string,
): Array<{ key: string; label: string; description: string }> {
  return CATEGORY_CHECKLIST[category] ?? CATEGORY_CHECKLIST['default'];
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required.`);

// ─── Procurement request schema ───────────────────────────────────────────────

export const procurementRequestSchema = z.object({
  title: nonEmpty('Title').max(200, 'Title must be 200 characters or fewer.'),

  description: nonEmpty('Description').max(5000, 'Description must be 5000 characters or fewer.'),

  category: z.enum(PROCUREMENT_CATEGORIES, {
    error: 'Please select a valid category.',
  }),

  proposed_budget: z
    .string()
    .trim()
    .min(1, 'Proposed budget is required.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Budget must be a number with up to 2 decimal places.')
    .refine((v) => parseFloat(v) >= 0, 'Budget must be zero or greater.'),

  desired_start_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),

  submission_deadline: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),

  agency_org_id: z.string().uuid('Invalid agency ID.'),
});

export type ProcurementRequestInput = z.infer<typeof procurementRequestSchema>;

// ─── Review action schema ─────────────────────────────────────────────────────

export const REVIEW_DECISIONS = [
  'approve',
  'reject',
  'request_correction',
  'place_on_hold',
  'resume_from_hold',
] as const;

export type ReviewDecisionInput = (typeof REVIEW_DECISIONS)[number];

export const reviewActionSchema = z
  .object({
    request_id: z.string().uuid('Invalid request ID.'),
    decision: z.enum(REVIEW_DECISIONS, {
      error: 'Invalid review decision.',
    }),
    note: z
      .string()
      .trim()
      .max(2000, 'Note must be 2000 characters or fewer.')
      .optional()
      .nullable()
      .transform((v) => v || null),
  })
  .superRefine((data, ctx) => {
    // Rationale is required for approve and reject
    if ((data.decision === 'approve' || data.decision === 'reject') && !data.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'A rationale is required when approving or rejecting a request.',
      });
    }
    // Explanation required for correction request
    if (data.decision === 'request_correction' && !data.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'Please explain what corrections are needed.',
      });
    }
  });

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

// ─── Comment schema ───────────────────────────────────────────────────────────

export const commentSchema = z.object({
  request_id: z.string().uuid('Invalid request ID.'),
  body: nonEmpty('Comment').max(5000, 'Comment must be 5000 characters or fewer.'),
  is_internal: z.boolean().default(false),
  parent_id: z.string().uuid().optional().nullable(),
});

export type CommentInput = z.infer<typeof commentSchema>;

export const checklistReviewSchema = z
  .object({
    request_id: z.string().uuid('Invalid request ID.'),
    item_id: z.string().uuid('Invalid checklist item ID.'),
    status: z.enum(['pending', 'satisfied', 'flagged', 'waived']),
    note: z.string().trim().max(2000, 'Note must be 2000 characters or fewer.').nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'flagged' && !data.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'Explain what must be corrected when flagging an item.',
      });
    }
  });

export const documentReviewSchema = z
  .object({
    request_id: z.string().uuid('Invalid request ID.'),
    document_id: z.string().uuid('Invalid document ID.'),
    status: z.enum(['accepted', 'rejected']),
    note: z.string().trim().max(2000, 'Note must be 2000 characters or fewer.').nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'rejected' && !data.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'Explain why the document was rejected.',
      });
    }
  });

// ─── Status transition table ──────────────────────────────────────────────────

import type { RequestStatus } from '@/types/database';

/**
 * Valid status transitions keyed by decision.
 * The value is the resulting status.
 */
export const DECISION_TO_STATUS: Record<string, RequestStatus> = {
  approve: 'approved',
  reject: 'rejected',
  request_correction: 'awaiting_correction',
  place_on_hold: 'on_hold',
  resume_from_hold: 'under_review',
};

/**
 * Allowed transitions: from_status -> allowed decisions.
 */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, string[]> = {
  draft: [],
  submitted: [],
  under_review: ['approve', 'reject', 'request_correction', 'place_on_hold'],
  awaiting_correction: [],
  correction_submitted: [],
  on_hold: ['resume_from_hold', 'reject'],
  approved: [],
  rejected: [],
  withdrawn: [],
};

/** Returns whether a given decision is legal from the current status */
export function isTransitionAllowed(currentStatus: RequestStatus, decision: string): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(decision) ?? false;
}

export function isStartReviewAllowed(currentStatus: RequestStatus): boolean {
  return currentStatus === 'submitted' || currentStatus === 'correction_submitted';
}

/** The status that results from an applicant submitting a draft */
export const SUBMIT_TARGET_STATUS: RequestStatus = 'submitted';

export function getSubmissionTargetStatus(currentStatus: RequestStatus): RequestStatus {
  return currentStatus === 'awaiting_correction' ? 'correction_submitted' : SUBMIT_TARGET_STATUS;
}
