-- ============================================================
-- 004 — Workflow Tables
--   comments
--   review_actions
--   status_history   (append-only)
--   activity_log     (append-only)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- comments
-- Threaded discussion attached to a procurement request.
-- Supports top-level and reply-to-parent comments.
-- ──────────────────────────────────────────────────────────
create table public.comments (
  id              uuid        primary key default gen_random_uuid(),
  request_id      uuid        not null references public.procurement_requests (id) on delete cascade,
  parent_id       uuid        references public.comments (id) on delete cascade,
  author_id       uuid        not null references public.profiles (id),
  body            text        not null check (char_length(body) > 0),
  is_internal     boolean     not null default false,  -- analyst-only internal notes
  edited_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.comments is
  'Threaded comments on a procurement request. is_internal = analyst-only notes.';

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- review_actions
-- Records each formal action an analyst takes on a request
-- (request correction, approve, reject, etc.).
-- ──────────────────────────────────────────────────────────
create table public.review_actions (
  id              uuid                    primary key default gen_random_uuid(),
  request_id      uuid                    not null references public.procurement_requests (id) on delete cascade,
  analyst_id      uuid                    not null references public.profiles (id),
  decision        public.review_decision  not null,
  note            text,
  created_at      timestamptz             not null default now()

  -- Intentionally no updated_at: review actions are immutable records.
);

comment on table public.review_actions is
  'Immutable log of each formal analyst decision on a procurement request.';

-- Prevent any row from being updated (append-only enforcement at DB level)
create rule review_actions_no_update as
  on update to public.review_actions do instead nothing;

create rule review_actions_no_delete as
  on delete to public.review_actions do instead nothing;

-- ──────────────────────────────────────────────────────────
-- status_history
-- Append-only record of every status transition on a request.
-- ──────────────────────────────────────────────────────────
create table public.status_history (
  id              uuid                primary key default gen_random_uuid(),
  request_id      uuid                not null references public.procurement_requests (id) on delete cascade,
  changed_by      uuid                not null references public.profiles (id),
  from_status     public.request_status,           -- null on initial insert
  to_status       public.request_status not null,
  reason          text,
  created_at      timestamptz         not null default now()
);

comment on table public.status_history is
  'Append-only audit trail of every status change for a procurement request.';

-- Prevent updates and deletes to enforce append-only
create rule status_history_no_update as
  on update to public.status_history do instead nothing;

create rule status_history_no_delete as
  on delete to public.status_history do instead nothing;

-- ──────────────────────────────────────────────────────────
-- activity_log
-- Append-only structured event log.  Records any significant
-- user action across the application for audit trail and
-- reporting purposes.
-- ──────────────────────────────────────────────────────────
create table public.activity_log (
  id              uuid        primary key default gen_random_uuid(),
  actor_id        uuid        references public.profiles (id) on delete set null,
  request_id      uuid        references public.procurement_requests (id) on delete set null,
  event_type      text        not null check (char_length(event_type) > 0),
  entity_type     text,       -- e.g. 'procurement_request', 'comment', 'document'
  entity_id       uuid,
  metadata        jsonb,      -- arbitrary structured context
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

comment on table public.activity_log is
  'Append-only structured audit log. Records all significant application events.';

-- Prevent updates and deletes to enforce append-only
create rule activity_log_no_update as
  on update to public.activity_log do instead nothing;

create rule activity_log_no_delete as
  on delete to public.activity_log do instead nothing;
