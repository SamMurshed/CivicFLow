-- ============================================================
-- Seed Data — CivicFlow Fictional Demonstration Data
--
-- All names, organisations, and data are entirely fictional
-- and invented solely for demonstration purposes.
-- No real procurement data, government information, or
-- personal data is contained herein.
--
-- Load order:
--   1. organisations
--   2. auth.users (stub rows — Supabase creates real users via
--      the Auth API; these stubs allow FK references in tests
--      and local SQL-only runs)
--   3. profiles
--   4. vendor_profiles
--   5. checklist_templates + items
--   6. knowledge_articles
--   7. procurement_requests
--   8. request_checklist_items
--   9. comments / review_actions / status_history
--  10. notifications
-- ============================================================

-- Disable RLS for the seed session so inserts bypass policies
-- (run as postgres / service role in production migrations)
set local role postgres;

-- ──────────────────────────────────────────────────────────
-- Stable UUIDs for seed records
-- Using deterministic values so re-runs are idempotent.
-- ──────────────────────────────────────────────────────────

-- Organizations
\set org_northdale    '''d0000001-0000-0000-0000-000000000001'''
\set org_westmarch    '''d0000001-0000-0000-0000-000000000002'''
\set org_apexsupply   '''d0000001-0000-0000-0000-000000000003'''
\set org_blueridge    '''d0000001-0000-0000-0000-000000000004'''
\set org_zenith       '''d0000001-0000-0000-0000-000000000005'''

-- Users / Profiles
\set user_admin       '''a0000001-0000-0000-0000-000000000001'''
\set user_analyst1    '''a0000001-0000-0000-0000-000000000002'''
\set user_analyst2    '''a0000001-0000-0000-0000-000000000003'''
\set user_agency1     '''a0000001-0000-0000-0000-000000000004'''
\set user_agency2     '''a0000001-0000-0000-0000-000000000005'''
\set user_agency3     '''a0000001-0000-0000-0000-000000000006'''
\set user_vendor1     '''a0000001-0000-0000-0000-000000000007'''
\set user_vendor2     '''a0000001-0000-0000-0000-000000000008'''
\set user_vendor3     '''a0000001-0000-0000-0000-000000000009'''

-- Checklist templates
\set tmpl_standard    '''c0000001-0000-0000-0000-000000000001'''
\set tmpl_it          '''c0000001-0000-0000-0000-000000000002'''

-- Knowledge articles
\set ka_howto_submit  '''b0000001-0000-0000-0000-000000000001'''
\set ka_checklist_guide '''b0000001-0000-0000-0000-000000000002'''
\set ka_grant_compliance '''b0000001-0000-0000-0000-000000000003'''
\set ka_disaster_recovery '''b0000001-0000-0000-0000-000000000004'''

-- Requests
\set req_draft        '''e0000001-0000-0000-0000-000000000001'''
\set req_submitted    '''e0000001-0000-0000-0000-000000000002'''
\set req_under_review '''e0000001-0000-0000-0000-000000000003'''
\set req_awaiting     '''e0000001-0000-0000-0000-000000000004'''
\set req_approved     '''e0000001-0000-0000-0000-000000000005'''
\set req_rejected     '''e0000001-0000-0000-0000-000000000006'''

-- ──────────────────────────────────────────────────────────
-- 1. Organizations
-- ──────────────────────────────────────────────────────────
insert into public.organizations (id, name, kind, description, website_url) values
  (:org_northdale, 'Northdale Municipal Authority',    'agency',  'Fictional municipal authority for the Northdale region.',          'https://northdale.example'),
  (:org_westmarch, 'Westmarch County Council',         'agency',  'Fictional county council serving the Westmarch district.',         'https://westmarch.example'),
  (:org_apexsupply,'Apex Supply Solutions Ltd',        'vendor',  'Fictional general-purpose supply and logistics vendor.',           'https://apex.example'),
  (:org_blueridge, 'Blue Ridge Technology Partners',   'vendor',  'Fictional IT infrastructure and software services vendor.',        'https://blueridge.example'),
  (:org_zenith,    'Zenith Facilities Group',          'vendor',  'Fictional facilities management and maintenance vendor.',          'https://zenith.example')
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────
-- 2. Stub auth.users rows (local/test only)
--    In a live Supabase project, users are created via Auth API.
--    These stubs allow FK references without a real auth flow.
-- ──────────────────────────────────────────────────────────
insert into auth.users (
  id, email, email_confirmed_at, created_at, updated_at,
  encrypted_password, role, aud
) values
  (:user_admin,    'admin@civicflow.example',          now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_analyst1, 'analyst.morgan@civicflow.example', now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_analyst2, 'analyst.reyes@civicflow.example',  now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_agency1,  'agency.thornton@northdale.example',now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_agency2,  'agency.okafor@northdale.example',  now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_agency3,  'agency.walsh@westmarch.example',   now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_vendor1,  'vendor.chen@apex.example',         now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_vendor2,  'vendor.kowalski@blueridge.example',now(), now(), now(), '', 'authenticated', 'authenticated'),
  (:user_vendor3,  'vendor.osei@zenith.example',       now(), now(), now(), '', 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────
-- 3. Profiles
-- ──────────────────────────────────────────────────────────
insert into public.profiles (id, organization_id, role, full_name, email) values
  (:user_admin,    null,            'admin',        'Alex Admin',          'admin@civicflow.example'),
  (:user_analyst1, null,            'analyst',      'Morgan Castellano',   'analyst.morgan@civicflow.example'),
  (:user_analyst2, null,            'analyst',      'Priya Reyes',         'analyst.reyes@civicflow.example'),
  (:user_agency1,  :org_northdale,  'agency_user',  'Sam Thornton',        'agency.thornton@northdale.example'),
  (:user_agency2,  :org_northdale,  'agency_user',  'Dana Okafor',         'agency.okafor@northdale.example'),
  (:user_agency3,  :org_westmarch,  'agency_user',  'Casey Walsh',         'agency.walsh@westmarch.example'),
  (:user_vendor1,  :org_apexsupply, 'vendor',       'Jordan Chen',         'vendor.chen@apex.example'),
  (:user_vendor2,  :org_blueridge,  'vendor',       'Aleksander Kowalski', 'vendor.kowalski@blueridge.example'),
  (:user_vendor3,  :org_zenith,     'vendor',       'Kwame Osei',          'vendor.osei@zenith.example')
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────
-- 4. Vendor profiles
-- ──────────────────────────────────────────────────────────
insert into public.vendor_profiles (profile_id, organization_id, business_number, contact_phone, primary_category, is_verified, verified_at) values
  (:user_vendor1, :org_apexsupply, 'BN-10029341', '+1-555-0110', 'General Supplies',        true,  now() - interval '30 days'),
  (:user_vendor2, :org_blueridge,  'BN-10047822', '+1-555-0120', 'Information Technology',  true,  now() - interval '14 days'),
  (:user_vendor3, :org_zenith,     'BN-10053900', '+1-555-0130', 'Facilities Management',   false, null)
on conflict (profile_id) do nothing;

-- ──────────────────────────────────────────────────────────
-- 5. Checklist templates
-- ──────────────────────────────────────────────────────────
insert into public.checklist_templates (id, name, description, category, created_by) values
  (:tmpl_standard, 'Standard Procurement Checklist',
   'General-purpose checklist for most procurement categories.',
   null,
   :user_admin),
  (:tmpl_it, 'IT Services Procurement Checklist',
   'Extended checklist for information technology service contracts.',
   'Information Technology',
   :user_admin)
on conflict (id) do nothing;

-- Standard template items
insert into public.checklist_template_items (template_id, item_key, label, description, is_required, sort_order) values
  (:tmpl_standard, 'vendor_registration',   'Vendor Registration',        'Confirm the vendor is registered and in good standing.',                true,  1),
  (:tmpl_standard, 'financial_statements',  'Financial Statements',       'Obtain last two years of audited financial statements.',                true,  2),
  (:tmpl_standard, 'insurance_certificate', 'Insurance Certificate',      'Confirm valid general liability and professional indemnity insurance.', true,  3),
  (:tmpl_standard, 'conflict_of_interest',  'Conflict of Interest Form',  'Completed and signed conflict-of-interest declaration.',               true,  4),
  (:tmpl_standard, 'scope_of_work',         'Scope of Work',              'Detailed scope of work document provided by the agency.',              true,  5),
  (:tmpl_standard, 'budget_justification',  'Budget Justification',       'Line-item budget justification matches proposed budget.',              true,  6),
  (:tmpl_standard, 'references',            'Vendor References',          'At least two professional references supplied.',                       false, 7)
on conflict (template_id, item_key) do nothing;

-- IT-specific template items (inherits standard items conceptually; stored separately)
insert into public.checklist_template_items (template_id, item_key, label, description, is_required, sort_order) values
  (:tmpl_it, 'vendor_registration',   'Vendor Registration',        'Confirm the vendor is registered and in good standing.',                true,  1),
  (:tmpl_it, 'financial_statements',  'Financial Statements',       'Obtain last two years of audited financial statements.',                true,  2),
  (:tmpl_it, 'insurance_certificate', 'Insurance Certificate',      'Valid cyber-liability insurance in addition to general liability.',     true,  3),
  (:tmpl_it, 'conflict_of_interest',  'Conflict of Interest Form',  'Completed and signed conflict-of-interest declaration.',               true,  4),
  (:tmpl_it, 'scope_of_work',         'Scope of Work',              'Detailed technical scope including deliverables and SLAs.',            true,  5),
  (:tmpl_it, 'budget_justification',  'Budget Justification',       'Line-item budget justification matches proposed budget.',              true,  6),
  (:tmpl_it, 'security_assessment',   'Security Assessment',        'Third-party security posture assessment for hosted systems.',          true,  7),
  (:tmpl_it, 'data_handling_plan',    'Data Handling Plan',         'Documented data residency, retention, and disposal policy.',          true,  8),
  (:tmpl_it, 'references',            'Vendor References',          'At least two government-sector references supplied.',                 false, 9)
on conflict (template_id, item_key) do nothing;

-- ──────────────────────────────────────────────────────────
-- 6. Knowledge articles
-- ──────────────────────────────────────────────────────────
insert into public.knowledge_articles (id, title, slug, body, category, tags, is_published, published_at, author_id) values
  (:ka_howto_submit,
   'How to Submit a Procurement Request',
   'how-to-submit-procurement-request',
   E'## Submitting a Procurement Request\n\n'
   '### Step 1 — Create a Draft\n\n'
   'Navigate to the Requests section and click **New Request**. '
   'Fill in the project title, description, category, proposed budget, desired start date, and submission deadline. '
   'Save as a draft at any time.\n\n'
   '### Step 2 — Attach a Vendor\n\n'
   'Search for your preferred vendor organisation and link them to the request. '
   'The vendor will be notified once the request is submitted.\n\n'
   '### Step 3 — Submit\n\n'
   'Review all fields, then click **Submit for Review**. '
   'The request status changes to **Submitted** and enters the analyst review queue.\n\n'
   '> **Note:** Once submitted, a request can only be edited if an analyst raises a correction.',
   'Getting Started',
   array['submit', 'requests', 'guide'],
   true,
   now() - interval '60 days',
   :user_admin),

  (:ka_checklist_guide,
   'Understanding the Review Checklist',
   'understanding-review-checklist',
   E'## The Review Checklist\n\n'
   'When a procurement analyst opens your submission, they evaluate it against a structured checklist. '
   'Each checklist item represents a piece of information or documentation required for the request to proceed.\n\n'
   '### Item Statuses\n\n'
   '| Status | Meaning |\n'
   '|--------|---------|\n'
   '| **Pending** | The item has not yet been reviewed. |\n'
   '| **Satisfied** | The analyst confirmed the requirement is met. |\n'
   '| **Flagged** | The item is missing or insufficient — a correction is required. |\n'
   '| **Waived** | The analyst waived the item with documented justification. |\n\n'
   '### What Happens When Items Are Flagged\n\n'
   'If the analyst flags one or more items, the request status changes to **Awaiting Correction**. '
   'You will receive a notification. Provide the requested information or documents, then mark each item as resolved.',
   'Review Process',
   array['checklist', 'review', 'corrections'],
   true,
   now() - interval '45 days',
   :user_admin),

  (:ka_grant_compliance,
   'Grant and Compliance Documentation Basics',
   'grant-compliance-documentation-basics',
   E'## Build a Reviewable File\n\nKeep the approved scope, budget, procurement record, invoice, proof of payment, and delivery evidence together. Use consistent project identifiers across every document.\n\n## Reconcile Before Submission\n\nConfirm that each cost is within the approved period and scope, supported by documentation, and assigned to the correct funding stream. Record discrepancies and corrective actions instead of overwriting the original record.\n\n## Protect the Audit Trail\n\nDocument who reviewed each item, when the review occurred, what changed, and why. Escalate unclear requirements before a deadline is at risk.',
   'Grants & Compliance',
   array['grants', 'compliance', 'invoices', 'audit'],
   true,
   now() - interval '30 days',
   :user_admin),

  (:ka_disaster_recovery,
   'Disaster-Recovery Project Record Checklist',
   'disaster-recovery-project-record-checklist',
   E'## Preserve the Project Story\n\nMaintain the damage description, approved scope of work, location, cost estimate, contracts, invoices, proof of payment, insurance information, and progress evidence in one project record.\n\n## Track Changes\n\nWhen scope, schedule, or cost changes, record the reason, approval path, and supporting files. Keep prior versions available for audit review.\n\n## Review for Reimbursement\n\nBefore requesting reimbursement, reconcile claimed costs to the approved work and flag insurance or duplicate-funding questions for specialist review. This demonstration guidance is educational and does not replace current grant rules.',
   'Disaster Recovery',
   array['disaster recovery', 'grants', 'insurance', 'reimbursement'],
   true,
   now() - interval '15 days',
   :user_admin)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────
-- 7. Procurement requests (six statuses)
-- ──────────────────────────────────────────────────────────
insert into public.procurement_requests (
  id, title, description, category,
  proposed_budget, desired_start_date, submission_deadline,
  agency_org_id, vendor_org_id, submitted_by, assigned_analyst,
  status, submitted_at, decided_at, decision_rationale,
  created_at
) values

  -- Draft: agency user started but not submitted
  (:req_draft,
   'Office Supplies Annual Contract',
   'Annual contract for provision of general office supplies across Northdale Municipal offices.',
   'General Supplies',
   48000.00,
   '2025-07-01', '2025-05-31',
   :org_northdale, :org_apexsupply,
   :user_agency1, null,
   'draft', null, null, null,
   now() - interval '3 days'),

  -- Submitted: waiting for analyst assignment
  (:req_submitted,
   'Fleet Vehicle Maintenance Services',
   'Provision of preventive maintenance and emergency repair services for the Northdale municipal vehicle fleet.',
   'Facilities Management',
   120000.00,
   '2025-08-01', '2025-06-15',
   :org_northdale, :org_zenith,
   :user_agency2, null,
   'submitted', now() - interval '2 days', null, null,
   now() - interval '5 days'),

  -- Under review: analyst is working it
  (:req_under_review,
   'Network Infrastructure Upgrade — Phase 2',
   'Upgrade of core switching and wireless access infrastructure across all Westmarch County offices.',
   'Information Technology',
   340000.00,
   '2025-09-01', '2025-06-30',
   :org_westmarch, :org_blueridge,
   :user_agency3, :user_analyst1,
   'under_review', now() - interval '7 days', null, null,
   now() - interval '10 days'),

  -- Awaiting correction: analyst flagged items
  (:req_awaiting,
   'Document Management System Implementation',
   'Procurement of a hosted document management system with workflow automation for the Westmarch planning department.',
   'Information Technology',
   185000.00,
   '2025-10-01', '2025-07-15',
   :org_westmarch, :org_blueridge,
   :user_agency3, :user_analyst2,
   'awaiting_correction', now() - interval '14 days', null, null,
   now() - interval '21 days'),

  -- Approved
  (:req_approved,
   'Public Park Grounds Maintenance Contract',
   'Seasonal grounds maintenance for twelve public parks in the Northdale district.',
   'Facilities Management',
   76500.00,
   '2025-04-01', '2025-02-28',
   :org_northdale, :org_zenith,
   :user_agency1, :user_analyst1,
   'approved', now() - interval '45 days', now() - interval '10 days',
   'All checklist items satisfied. Budget is well-justified. Vendor references confirmed. Proceeding with approval.',
   now() - interval '55 days'),

  -- Rejected
  (:req_rejected,
   'Catering Services for Council Events',
   'Ad-hoc catering services for council-hosted public engagement events throughout the year.',
   'General Supplies',
   22000.00,
   '2025-05-01', '2025-03-31',
   :org_westmarch, :org_apexsupply,
   :user_agency3, :user_analyst2,
   'rejected', now() - interval '30 days', now() - interval '5 days',
   'Vendor insurance certificate expired and could not be renewed within the required period. Scope of work document was insufficient. Request rejected pending a fresh submission with a qualified vendor.',
   now() - interval '40 days')

on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────
-- 8. Request checklist items (for under_review and awaiting)
-- ──────────────────────────────────────────────────────────

-- under_review request — IT template applied, items pending
insert into public.request_checklist_items (request_id, item_key, label, is_required, status, sort_order) values
  (:req_under_review, 'vendor_registration',   'Vendor Registration',        true,  'satisfied', 1),
  (:req_under_review, 'financial_statements',  'Financial Statements',       true,  'pending',   2),
  (:req_under_review, 'insurance_certificate', 'Insurance Certificate',      true,  'pending',   3),
  (:req_under_review, 'conflict_of_interest',  'Conflict of Interest Form',  true,  'satisfied', 4),
  (:req_under_review, 'scope_of_work',         'Scope of Work',              true,  'pending',   5),
  (:req_under_review, 'budget_justification',  'Budget Justification',       true,  'pending',   6),
  (:req_under_review, 'security_assessment',   'Security Assessment',        true,  'pending',   7),
  (:req_under_review, 'data_handling_plan',    'Data Handling Plan',         true,  'pending',   8),
  (:req_under_review, 'references',            'Vendor References',          false, 'pending',   9)
on conflict (request_id, item_key) do nothing;

-- awaiting_correction request — some items flagged
insert into public.request_checklist_items (request_id, item_key, label, is_required, status, analyst_note, sort_order) values
  (:req_awaiting, 'vendor_registration',   'Vendor Registration',        true,  'satisfied', null,                                                                         1),
  (:req_awaiting, 'financial_statements',  'Financial Statements',       true,  'flagged',   'Only one year of statements provided. Two years required.',                  2),
  (:req_awaiting, 'insurance_certificate', 'Insurance Certificate',      true,  'satisfied', null,                                                                         3),
  (:req_awaiting, 'conflict_of_interest',  'Conflict of Interest Form',  true,  'satisfied', null,                                                                         4),
  (:req_awaiting, 'scope_of_work',         'Scope of Work',              true,  'flagged',   'SLAs are missing from the scope document. Please include response-time SLAs.',5),
  (:req_awaiting, 'budget_justification',  'Budget Justification',       true,  'pending',   null,                                                                         6),
  (:req_awaiting, 'security_assessment',   'Security Assessment',        true,  'pending',   null,                                                                         7),
  (:req_awaiting, 'data_handling_plan',    'Data Handling Plan',         true,  'pending',   null,                                                                         8),
  (:req_awaiting, 'references',            'Vendor References',          false, 'pending',   null,                                                                         9)
on conflict (request_id, item_key) do nothing;

-- ──────────────────────────────────────────────────────────
-- 9. Comments
-- ──────────────────────────────────────────────────────────
insert into public.comments (request_id, author_id, body, is_internal) values
  (:req_under_review, :user_analyst1,
   'Request received and under active review. I will reach out if additional documentation is needed.',
   false),
  (:req_awaiting, :user_analyst2,
   'Two correction items raised — please see the checklist. Provide the missing financial statements and update the scope document with SLA detail.',
   false),
  (:req_awaiting, :user_agency3,
   'Understood. We will coordinate with Blue Ridge and upload revised documents within five business days.',
   false),
  (:req_awaiting, :user_analyst2,
   'Internal note: vendor previously submitted an incomplete financial package on request REQ-2024-0091. Watch for same issue.',
   true),
  (:req_approved, :user_analyst1,
   'Congratulations — this request has been approved. You will receive formal notification shortly.',
   false)
on conflict do nothing;

-- ──────────────────────────────────────────────────────────
-- 10. Review actions
-- ──────────────────────────────────────────────────────────
insert into public.review_actions (request_id, analyst_id, decision, note) values
  (:req_under_review, :user_analyst1, 'request_correction',
   'Opening review. Initial documents present. Financial statements and scope document require verification.'),
  (:req_awaiting, :user_analyst2, 'request_correction',
   'Flagging two items: financial statements and scope of work SLA detail.'),
  (:req_approved, :user_analyst1, 'approve',
   'All items satisfied. Approved.'),
  (:req_rejected, :user_analyst2, 'reject',
   'Insurance certificate could not be renewed. Scope document insufficient. Rejected.')
on conflict do nothing;

-- ──────────────────────────────────────────────────────────
-- 11. Status history
-- ──────────────────────────────────────────────────────────
insert into public.status_history (request_id, changed_by, from_status, to_status, reason) values
  -- req_submitted
  (:req_submitted, :user_agency2, null, 'draft', 'Request created.'),
  (:req_submitted, :user_agency2, 'draft', 'submitted', 'Submitted for analyst review.'),

  -- req_under_review
  (:req_under_review, :user_agency3, null, 'draft', 'Request created.'),
  (:req_under_review, :user_agency3, 'draft', 'submitted', 'Submitted for analyst review.'),
  (:req_under_review, :user_analyst1, 'submitted', 'under_review', 'Analyst assigned and review commenced.'),

  -- req_awaiting
  (:req_awaiting, :user_agency3, null, 'draft', 'Request created.'),
  (:req_awaiting, :user_agency3, 'draft', 'submitted', 'Submitted for analyst review.'),
  (:req_awaiting, :user_analyst2, 'submitted', 'under_review', 'Analyst assigned and review commenced.'),
  (:req_awaiting, :user_analyst2, 'under_review', 'awaiting_correction', 'Two checklist items flagged for correction.'),

  -- req_approved
  (:req_approved, :user_agency1, null, 'draft', 'Request created.'),
  (:req_approved, :user_agency1, 'draft', 'submitted', 'Submitted for analyst review.'),
  (:req_approved, :user_analyst1, 'submitted', 'under_review', 'Review commenced.'),
  (:req_approved, :user_analyst1, 'under_review', 'approved', 'All items satisfied. Approved.'),

  -- req_rejected
  (:req_rejected, :user_agency3, null, 'draft', 'Request created.'),
  (:req_rejected, :user_agency3, 'draft', 'submitted', 'Submitted for analyst review.'),
  (:req_rejected, :user_analyst2, 'submitted', 'under_review', 'Review commenced.'),
  (:req_rejected, :user_analyst2, 'under_review', 'awaiting_correction', 'Insurance and scope items flagged.'),
  (:req_rejected, :user_analyst2, 'awaiting_correction', 'rejected', 'Insurance certificate could not be renewed. Rejected.')

on conflict do nothing;

-- ──────────────────────────────────────────────────────────
-- 12. Notifications
-- ──────────────────────────────────────────────────────────
insert into public.notifications (recipient_id, request_id, title, body, is_read) values
  (:user_agency3, :req_awaiting,
   'Corrections Required on Your Request',
   'Analyst Priya Reyes has raised two correction items on "Document Management System Implementation". Please review and respond.',
   false),
  (:user_vendor2, :req_awaiting,
   'Action Required: Procurement Request Corrections',
   'Corrections have been requested on the Document Management System Implementation procurement. Please provide updated documents.',
   false),
  (:user_agency1, :req_approved,
   'Request Approved',
   'Your procurement request "Public Park Grounds Maintenance Contract" has been approved.',
   true),
  (:user_vendor3, :req_approved,
   'Procurement Request Approved',
   'The procurement request you are attached to ("Public Park Grounds Maintenance Contract") has been approved.',
   true),
  (:user_agency3, :req_rejected,
   'Request Rejected',
   'Your procurement request "Catering Services for Council Events" has been rejected. See the decision rationale for details.',
   false)
on conflict do nothing;

-- ──────────────────────────────────────────────────────────
-- Re-enable standard role
-- ──────────────────────────────────────────────────────────
reset role;
