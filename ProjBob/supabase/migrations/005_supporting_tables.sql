-- ============================================================
-- 005 — Supporting Tables
--   notifications
--   knowledge_articles
--   feedback_items
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- notifications
-- In-app notifications sent to individual users.
-- ──────────────────────────────────────────────────────────
create table public.notifications (
  id              uuid        primary key default gen_random_uuid(),
  recipient_id    uuid        not null references public.profiles (id) on delete cascade,
  request_id      uuid        references public.procurement_requests (id) on delete cascade,
  title           text        not null,
  body            text        not null,
  link            text,       -- optional in-app deep link
  is_read         boolean     not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.notifications is
  'In-app notifications for individual users. Linked to an optional procurement request.';

-- ──────────────────────────────────────────────────────────
-- knowledge_articles
-- Help-centre style articles visible to users based on role.
-- Managed by administrators.
-- ──────────────────────────────────────────────────────────
create table public.knowledge_articles (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        not null,
  body            text        not null,
  category        text,
  tags            text[],
  is_published    boolean     not null default false,
  published_at    timestamptz,
  author_id       uuid        not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint knowledge_articles_slug_unique unique (slug)
);

comment on table public.knowledge_articles is
  'Help-centre articles created by administrators. Visible to all active users when published.';

create trigger trg_knowledge_articles_updated_at
  before update on public.knowledge_articles
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────
-- feedback_items
-- User-submitted feedback on knowledge articles or the
-- platform in general.
-- ──────────────────────────────────────────────────────────
create table public.feedback_items (
  id              uuid        primary key default gen_random_uuid(),
  submitted_by    uuid        references public.profiles (id) on delete set null,
  article_id      uuid        references public.knowledge_articles (id) on delete cascade,
  request_id      uuid        references public.procurement_requests (id) on delete cascade,
  rating          smallint    check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now(),

  -- Must relate to at least one thing
  constraint feedback_requires_target
    check (article_id is not null or request_id is not null)
);

comment on table public.feedback_items is
  'User feedback attached to a knowledge article or procurement request.';
