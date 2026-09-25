-- ============================================================
-- 003 — Procurement Tables
--   procurement_requests
--   checklist_templates
--   checklist_template_items
--   request_checklist_items
--   request_documents
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- procurement_requests
-- Central fact table for the platform.  Belongs to an agency
-- organisation and references a vendor organisation plus the
-- analyst assigned to review it.
-- Money stored as numeric(15,2) — exact decimal, not float.
-- ──────────────────────────────────────────────────────────
create table public.procurement_requests (
  id                    uuid            primary key default gen_random_uuid(),

  -- Content fields
  title                 text            not null,
  description           text            not null,
  category              text            not null,
  proposed_budget       numeric(15,2)   not null check (proposed_budget >= 0),
  desired_start_date    date,
  submission_deadline   date,

  -- Relationships
  agency_org_id         uuid            not null references public.organizations (id),
  vendor_org_id         uuid            references public.organizations (id),
  submitted_by          uuid            not null references public.profiles (id),
  assigned_analyst      uuid            references public.profiles (id),

  -- Workflow
  status                public.request_status not null default 'draft',
  submitted_at          timestamptz,
  decided_at            timestamptz,
  decision_rationale    text,

  -- Timestamps
  created_at            timestamptz     not null default now(),
  updated_at            timestamptz     not null default now(),

  -- Constraints
  constraint pr_agency_is_agency
    check (
      agency_org_id in (
        select id from public.organizations where kind = 'agency'
      )
    ),
  constraint pr_vendor_is_vendor
    check (
      vendor_org_id is null or vendor_org_id in (
        select id from public.organizations where kind = 'vendor'
      )
    ),
  constraint pr_deadline_after_today
    check (submission_deadline is null or submission_deadline > '2000-01-01'),
  constraint pr_decided_requires_rationale
    check (
      (status not in ('approved', 'rejected'))
      or (decision_rationale is not null)
    )
);

comment on table public.procurement_requests is
  'Core procurement request. Tracks the full lifecycle from draft to decision.';

create trigger trg_procurement_requests_updated_at
  before update on public.procurement_requests
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- checklist_templates
-- Reusable review checklists created by admins.
-- Each request can have one active checklist template applied.
-- ──────────────────────────────────────────────────────────
create table public.checklist_templates (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  category    text,           -- Optional: only applicable to this category
  is_active   boolean     not null default true,
  created_by  uuid        not null references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint checklist_templates_name_unique unique (name)
);

comment on table public.checklist_templates is
  'Reusable analyst review checklists. Items defined in checklist_template_items.';

create trigger trg_checklist_templates_updated_at
  before update on public.checklist_templates
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- checklist_template_items
-- Individual line items within a checklist template.
-- ──────────────────────────────────────────────────────────
create table public.checklist_template_items (
  id              uuid        primary key default gen_random_uuid(),
  template_id     uuid        not null references public.checklist_templates (id) on delete cascade,
  item_key        text        not null,   -- stable machine identifier, e.g. "financial_statements"
  label           text        not null,
  description     text,
  is_required     boolean     not null default true,
  sort_order      smallint    not null default 0,
  created_at      timestamptz not null default now(),

  constraint cti_key_unique_per_template unique (template_id, item_key)
);

comment on table public.checklist_template_items is
  'Line items of a checklist template.';

-- ──────────────────────────────────────────────────────────
-- request_checklist_items
-- A live copy of checklist items for a specific request,
-- created when an analyst applies a template.
-- Tracks per-item status and analyst notes.
-- ──────────────────────────────────────────────────────────
create table public.request_checklist_items (
  id              uuid                        primary key default gen_random_uuid(),
  request_id      uuid                        not null references public.procurement_requests (id) on delete cascade,
  template_item_id uuid                       references public.checklist_template_items (id) on delete set null,
  item_key        text                        not null,
  label           text                        not null,
  description     text,
  is_required     boolean                     not null default true,
  status          public.checklist_item_status not null default 'pending',
  analyst_note    text,
  resolved_at     timestamptz,
  created_at      timestamptz                 not null default now(),
  updated_at      timestamptz                 not null default now(),

  constraint rci_key_unique_per_request unique (request_id, item_key)
);

comment on table public.request_checklist_items is
  'Live per-request checklist. Copied from a template when applied; mutated by analyst during review.';

create trigger trg_request_checklist_items_updated_at
  before update on public.request_checklist_items
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- request_documents
-- Files uploaded against a procurement request.
-- The actual file is stored in Supabase Storage; this table
-- records the metadata and review status.
-- ──────────────────────────────────────────────────────────
create table public.request_documents (
  id              uuid                    primary key default gen_random_uuid(),
  request_id      uuid                    not null references public.procurement_requests (id) on delete cascade,
  checklist_item_id uuid                  references public.request_checklist_items (id) on delete set null,
  uploaded_by     uuid                    not null references public.profiles (id),
  file_name       text                    not null,
  storage_path    text                    not null,   -- path inside Supabase Storage bucket
  mime_type       text,
  file_size_bytes bigint,
  status          public.document_status  not null default 'uploaded',
  reviewer_note   text,
  reviewed_at     timestamptz,
  reviewed_by     uuid                    references public.profiles (id),
  created_at      timestamptz             not null default now(),
  updated_at      timestamptz             not null default now(),

  constraint rd_file_size_positive check (file_size_bytes is null or file_size_bytes > 0)
);

comment on table public.request_documents is
  'Document metadata for files uploaded to a procurement request.';

create trigger trg_request_documents_updated_at
  before update on public.request_documents
  for each row execute function public.set_updated_at();
