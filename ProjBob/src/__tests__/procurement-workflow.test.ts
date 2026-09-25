/**
 * Task 6 — Procurement Workflow Tests
 *
 * Covers:
 *   • procurementRequestSchema — valid input, field rules, budget formatting
 *   • reviewActionSchema — valid decisions, rationale requirements
 *   • commentSchema — body limits, is_internal rules
 *   • getChecklistForCategory — category → items mapping
 *   • calcChecklistCompletion — completion logic including waived
 *   • isTransitionAllowed — all status × decision combinations
 *   • DECISION_TO_STATUS — correct output status for each decision
 */

import { describe, expect, it } from 'vitest';
import {
  procurementRequestSchema,
  reviewActionSchema,
  commentSchema,
  getChecklistForCategory,
  isTransitionAllowed,
  DECISION_TO_STATUS,
  ALLOWED_TRANSITIONS,
} from '@/validation/procurement-request';
import { calcChecklistCompletion } from '@/lib/checklist-completion';
import type { RequestChecklistItem } from '@/types/database';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_REQUEST = {
  title: 'Network Infrastructure Upgrade',
  description: 'Replace aging switches and routers across all three floors.',
  category: 'Information Technology' as const,
  proposed_budget: '45000.00',
  desired_start_date: null,
  submission_deadline: null,
  agency_org_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};

function makeChecklistItem(
  overrides: Partial<RequestChecklistItem> = {},
): RequestChecklistItem {
  return {
    id: 'item-1',
    request_id: 'req-1',
    template_item_id: null,
    item_key: 'scope_of_work',
    label: 'Scope of Work',
    description: null,
    is_required: true,
    status: 'pending',
    analyst_note: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── procurementRequestSchema ─────────────────────────────────────────────────

describe('procurementRequestSchema', () => {
  it('accepts a fully valid input', () => {
    const result = procurementRequestSchema.safeParse(VALID_REQUEST);
    expect(result.success).toBe(true);
  });

  it('accepts input with null dates', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      desired_start_date: null,
      submission_deadline: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with empty string dates (transforms to null)', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      desired_start_date: '',
      submission_deadline: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.desired_start_date).toBeNull();
      expect(result.data.submission_deadline).toBeNull();
    }
  });

  it('rejects missing title', () => {
    const result = procurementRequestSchema.safeParse({ ...VALID_REQUEST, title: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'title')).toBe(true);
  });

  it('rejects title over 200 characters', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      title: 'A'.repeat(201),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'title')).toBe(true);
  });

  it('rejects missing description', () => {
    const result = procurementRequestSchema.safeParse({ ...VALID_REQUEST, description: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'description')).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      category: 'Invalid Category',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'category')).toBe(true);
  });

  it('rejects missing budget', () => {
    const result = procurementRequestSchema.safeParse({ ...VALID_REQUEST, proposed_budget: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'proposed_budget')).toBe(true);
  });

  it('rejects non-numeric budget', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      proposed_budget: 'fifty-thousand',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'proposed_budget')).toBe(true);
  });

  it('accepts whole number budget', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      proposed_budget: '50000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects budget with more than 2 decimal places', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      proposed_budget: '50000.123',
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero budget', () => {
    const result = procurementRequestSchema.safeParse({ ...VALID_REQUEST, proposed_budget: '0' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid agency UUID', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      agency_org_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'agency_org_id')).toBe(true);
  });

  it('trims whitespace from title', () => {
    const result = procurementRequestSchema.safeParse({
      ...VALID_REQUEST,
      title: '  Network Upgrade  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Network Upgrade');
    }
  });
});

// ─── reviewActionSchema ───────────────────────────────────────────────────────

describe('reviewActionSchema', () => {
  it('accepts a valid approve decision with note', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'approve',
      note: 'All documents verified and requirements met.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts place_on_hold without a note', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'place_on_hold',
      note: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects approve without a note', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'approve',
      note: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'note')).toBe(true);
  });

  it('rejects reject without a note', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'reject',
      note: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'note')).toBe(true);
  });

  it('rejects request_correction without a note', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'request_correction',
      note: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'note')).toBe(true);
  });

  it('rejects invalid decision value', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'upvote',
      note: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'decision')).toBe(true);
  });

  it('rejects invalid request UUID', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'not-a-uuid',
      decision: 'approve',
      note: 'fine',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a note over 2000 characters', () => {
    const result = reviewActionSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      decision: 'approve',
      note: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ─── commentSchema ────────────────────────────────────────────────────────────

describe('commentSchema', () => {
  it('accepts a valid public comment', () => {
    const result = commentSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      body: 'Please clarify the scope of work requirements.',
      is_internal: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an internal note', () => {
    const result = commentSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      body: 'Internal: Flag for compliance review.',
      is_internal: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty body', () => {
    const result = commentSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      body: '',
      is_internal: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path[0] === 'body')).toBe(true);
  });

  it('rejects body over 5000 characters', () => {
    const result = commentSchema.safeParse({
      request_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      body: 'x'.repeat(5001),
      is_internal: false,
    });
    expect(result.success).toBe(false);
  });
});

// ─── getChecklistForCategory ──────────────────────────────────────────────────

describe('getChecklistForCategory', () => {
  it('returns items for Information Technology', () => {
    const items = getChecklistForCategory('Information Technology');
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.key === 'scope_of_work')).toBe(true);
    expect(items.some((i) => i.key === 'security_requirements')).toBe(true);
  });

  it('returns items for Construction & Engineering', () => {
    const items = getChecklistForCategory('Construction & Engineering');
    expect(items.some((i) => i.key === 'insurance')).toBe(true);
    expect(items.some((i) => i.key === 'permits')).toBe(true);
  });

  it('returns default items for an unknown category', () => {
    const items = getChecklistForCategory('Unknown Category');
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.key === 'scope_of_work')).toBe(true);
  });

  it('returns items for Professional Services', () => {
    const items = getChecklistForCategory('Professional Services');
    expect(items.some((i) => i.key === 'qualifications')).toBe(true);
  });

  it('every item has a key, label, and description', () => {
    const items = getChecklistForCategory('Information Technology');
    for (const item of items) {
      expect(item.key).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });
});

// ─── calcChecklistCompletion ──────────────────────────────────────────────────

describe('calcChecklistCompletion', () => {
  it('returns all-met when there are no items', () => {
    const result = calcChecklistCompletion([]);
    expect(result.total).toBe(0);
    expect(result.allRequiredMet).toBe(true);
  });

  it('returns not-met when required item is pending', () => {
    const items = [makeChecklistItem({ is_required: true, status: 'pending' })];
    const result = calcChecklistCompletion(items);
    expect(result.allRequiredMet).toBe(false);
    expect(result.required).toBe(1);
    expect(result.requiredSatisfied).toBe(0);
  });

  it('returns met when required item is satisfied', () => {
    const items = [makeChecklistItem({ is_required: true, status: 'satisfied' })];
    const result = calcChecklistCompletion(items);
    expect(result.allRequiredMet).toBe(true);
    expect(result.requiredSatisfied).toBe(1);
  });

  it('counts waived items as satisfied', () => {
    const items = [makeChecklistItem({ is_required: true, status: 'waived' })];
    const result = calcChecklistCompletion(items);
    expect(result.allRequiredMet).toBe(true);
    expect(result.requiredSatisfied).toBe(1);
  });

  it('returns not-met when some required items pending', () => {
    const items = [
      makeChecklistItem({ id: '1', item_key: 'a', is_required: true, status: 'satisfied' }),
      makeChecklistItem({ id: '2', item_key: 'b', is_required: true, status: 'pending' }),
    ];
    const result = calcChecklistCompletion(items);
    expect(result.allRequiredMet).toBe(false);
    expect(result.requiredSatisfied).toBe(1);
    expect(result.required).toBe(2);
  });

  it('counts optional pending items but does not block allRequiredMet', () => {
    const items = [
      makeChecklistItem({ id: '1', item_key: 'a', is_required: true, status: 'satisfied' }),
      makeChecklistItem({ id: '2', item_key: 'b', is_required: false, status: 'pending' }),
    ];
    const result = calcChecklistCompletion(items);
    expect(result.allRequiredMet).toBe(true);
    expect(result.total).toBe(2);
  });
});

// ─── isTransitionAllowed ──────────────────────────────────────────────────────

describe('isTransitionAllowed', () => {
  it('allows approve from submitted', () => {
    expect(isTransitionAllowed('submitted', 'approve')).toBe(true);
  });

  it('allows reject from under_review', () => {
    expect(isTransitionAllowed('under_review', 'reject')).toBe(true);
  });

  it('allows request_correction from submitted', () => {
    expect(isTransitionAllowed('submitted', 'request_correction')).toBe(true);
  });

  it('allows request_correction from correction_submitted', () => {
    expect(isTransitionAllowed('correction_submitted', 'request_correction')).toBe(true);
  });

  it('allows place_on_hold from under_review', () => {
    expect(isTransitionAllowed('under_review', 'place_on_hold')).toBe(true);
  });

  it('allows resume_from_hold from on_hold', () => {
    expect(isTransitionAllowed('on_hold', 'resume_from_hold')).toBe(true);
  });

  it('does not allow approve from draft', () => {
    expect(isTransitionAllowed('draft', 'approve')).toBe(false);
  });

  it('does not allow approve from awaiting_correction', () => {
    expect(isTransitionAllowed('awaiting_correction', 'approve')).toBe(false);
  });

  it('does not allow any decision from approved (terminal)', () => {
    for (const decision of ['approve', 'reject', 'request_correction', 'place_on_hold']) {
      expect(isTransitionAllowed('approved', decision)).toBe(false);
    }
  });

  it('does not allow any decision from rejected (terminal)', () => {
    for (const decision of ['approve', 'reject', 'request_correction']) {
      expect(isTransitionAllowed('rejected', decision)).toBe(false);
    }
  });

  it('does not allow resume_from_hold from submitted', () => {
    expect(isTransitionAllowed('submitted', 'resume_from_hold')).toBe(false);
  });
});

// ─── DECISION_TO_STATUS ───────────────────────────────────────────────────────

describe('DECISION_TO_STATUS', () => {
  it('approve → approved', () => {
    expect(DECISION_TO_STATUS['approve']).toBe('approved');
  });

  it('reject → rejected', () => {
    expect(DECISION_TO_STATUS['reject']).toBe('rejected');
  });

  it('request_correction → awaiting_correction', () => {
    expect(DECISION_TO_STATUS['request_correction']).toBe('awaiting_correction');
  });

  it('place_on_hold → on_hold', () => {
    expect(DECISION_TO_STATUS['place_on_hold']).toBe('on_hold');
  });

  it('resume_from_hold → under_review', () => {
    expect(DECISION_TO_STATUS['resume_from_hold']).toBe('under_review');
  });
});

// ─── ALLOWED_TRANSITIONS coverage ────────────────────────────────────────────

describe('ALLOWED_TRANSITIONS coverage', () => {
  it('draft has no allowed decisions (agency submits via separate action)', () => {
    expect(ALLOWED_TRANSITIONS['draft']).toHaveLength(0);
  });

  it('awaiting_correction has no allowed decisions (agency must resubmit)', () => {
    expect(ALLOWED_TRANSITIONS['awaiting_correction']).toHaveLength(0);
  });

  it('correction_submitted allows standard analyst decisions', () => {
    const allowed = ALLOWED_TRANSITIONS['correction_submitted'];
    expect(allowed).toContain('approve');
    expect(allowed).toContain('reject');
    expect(allowed).toContain('request_correction');
  });

  it('on_hold allows resume and reject only', () => {
    const allowed = ALLOWED_TRANSITIONS['on_hold'];
    expect(allowed).toContain('resume_from_hold');
    expect(allowed).toContain('reject');
    expect(allowed).not.toContain('approve');
  });
});
