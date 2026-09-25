-- ============================================================
-- 007 — Row Level Security (RLS)
--
-- Design principles:
--   • Every exposed table has RLS enabled.
--   • A helper function resolves the current user's profile
--     once per statement to avoid repeated subqueries.
--   • Four roles: vendor, agency_user, analyst, admin.
--   • Admins bypass all RLS via a BYPASSRLS grant on the
--     supabase service role; the policies here govern the
--     anon/authenticated roles used by the application.
--   • Append-only tables (status_history, activity_log,
--     review_actions) allow INSERT but never UPDATE/DELETE
--     through either rules (migration 004) or policy.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- Helper: current user's profile row (cached per transaction)
-- ──────────────────────────────────────────────────────────
create or replace function public.current_profile()
returns public.profiles
language sql stable security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid() limit 1;
$$;

-- ──────────────────────────────────────────────────────────
-- Helper: current user's role
-- ──────────────────────────────────────────────────────────
create or replace function public.current_role_name()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- ──────────────────────────────────────────────────────────
-- Helper: current user's organization_id
-- ──────────────────────────────────────────────────────────
create or replace function public.current_org_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$;

-- ──────────────────────────────────────────────────────────
-- Enable RLS on every table
-- ──────────────────────────────────────────────────────────
alter table public.organizations           enable row level security;
alter table public.profiles                enable row level security;
alter table public.vendor_profiles         enable row level security;
alter table public.procurement_requests    enable row level security;
alter table public.checklist_templates     enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.request_checklist_items enable row level security;
alter table public.request_documents       enable row level security;
alter table public.comments                enable row level security;
alter table public.review_actions          enable row level security;
alter table public.status_history          enable row level security;
alter table public.activity_log            enable row level security;
alter table public.notifications           enable row level security;
alter table public.knowledge_articles      enable row level security;
alter table public.feedback_items          enable row level security;

-- ============================================================
-- TABLE: organizations
-- ============================================================

-- All authenticated users can see active organizations
-- (needed to populate dropdowns, display names, etc.)
create policy "organizations: authenticated users can read"
  on public.organizations for select
  to authenticated
  using (is_active = true);

-- Admins can manage all organizations
create policy "organizations: admins can insert"
  on public.organizations for insert
  to authenticated
  with check (public.current_role_name() = 'admin');

create policy "organizations: admins can update"
  on public.organizations for update
  to authenticated
  using  (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

create policy "organizations: admins can delete"
  on public.organizations for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: profiles
-- ============================================================

-- Users can read their own profile; admins can read all
create policy "profiles: users read own; admins read all"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_role_name() = 'admin'
    -- analysts need to see profiles to display names
    or public.current_role_name() = 'analyst'
    -- agency users need to see vendor profiles for request display
    or (
      public.current_role_name() = 'agency_user'
      and organization_id = public.current_org_id()
    )
  );

-- Users can insert their own profile (triggered by auth sign-up)
create policy "profiles: users insert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Users can update their own profile; admins can update any
create policy "profiles: users update own; admins update all"
  on public.profiles for update
  to authenticated
  using  (id = auth.uid() or public.current_role_name() = 'admin')
  with check (id = auth.uid() or public.current_role_name() = 'admin');

-- Only admins can delete profiles
create policy "profiles: admins can delete"
  on public.profiles for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: vendor_profiles
-- ============================================================

-- Vendors see their own extended profile; admins and analysts see all
create policy "vendor_profiles: select"
  on public.vendor_profiles for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.current_role_name() in ('admin', 'analyst')
    or (
      public.current_role_name() = 'agency_user'
      and organization_id in (
        select id from public.organizations where kind = 'vendor'
      )
    )
  );

create policy "vendor_profiles: vendors insert own"
  on public.vendor_profiles for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and public.current_role_name() = 'vendor'
  );

create policy "vendor_profiles: vendors and admins update"
  on public.vendor_profiles for update
  to authenticated
  using (
    profile_id = auth.uid()
    or public.current_role_name() = 'admin'
  )
  with check (
    profile_id = auth.uid()
    or public.current_role_name() = 'admin'
  );

create policy "vendor_profiles: admins delete"
  on public.vendor_profiles for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: procurement_requests
-- ============================================================

-- Vendors: only requests where their org is the vendor org
create policy "procurement_requests: vendors see own org requests"
  on public.procurement_requests for select
  to authenticated
  using (
    (public.current_role_name() = 'vendor'   and vendor_org_id   = public.current_org_id())
    or (public.current_role_name() = 'agency_user' and agency_org_id = public.current_org_id())
    or (public.current_role_name() = 'analyst' and (
          assigned_analyst = auth.uid()
          or status in ('submitted', 'under_review', 'awaiting_correction', 'correction_submitted')
       ))
    or public.current_role_name() = 'admin'
  );

-- Agency users create requests for their own agency
create policy "procurement_requests: agency users insert"
  on public.procurement_requests for insert
  to authenticated
  with check (
    public.current_role_name() = 'agency_user'
    and agency_org_id = public.current_org_id()
    and submitted_by  = auth.uid()
  );

-- Agency users update their own draft/awaiting-correction requests;
-- analysts update requests assigned to them; admins update anything
create policy "procurement_requests: update"
  on public.procurement_requests for update
  to authenticated
  using (
    (public.current_role_name() = 'agency_user'
      and agency_org_id = public.current_org_id()
      and status in ('draft', 'awaiting_correction'))
    or (public.current_role_name() = 'analyst' and assigned_analyst = auth.uid())
    or public.current_role_name() = 'admin'
  )
  with check (
    (public.current_role_name() = 'agency_user'
      and agency_org_id = public.current_org_id())
    or (public.current_role_name() = 'analyst' and assigned_analyst = auth.uid())
    or public.current_role_name() = 'admin'
  );

-- Only admins may hard-delete requests
create policy "procurement_requests: admins delete"
  on public.procurement_requests for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: checklist_templates
-- ============================================================

-- All authenticated users can read active templates (for reference)
create policy "checklist_templates: authenticated read"
  on public.checklist_templates for select
  to authenticated
  using (is_active = true or public.current_role_name() = 'admin');

-- Only admins can manage templates
create policy "checklist_templates: admins insert"
  on public.checklist_templates for insert
  to authenticated
  with check (public.current_role_name() = 'admin');

create policy "checklist_templates: admins update"
  on public.checklist_templates for update
  to authenticated
  using  (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

create policy "checklist_templates: admins delete"
  on public.checklist_templates for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: checklist_template_items
-- ============================================================

create policy "checklist_template_items: authenticated read"
  on public.checklist_template_items for select
  to authenticated
  using (true);

create policy "checklist_template_items: admins write"
  on public.checklist_template_items for insert
  to authenticated
  with check (public.current_role_name() = 'admin');

create policy "checklist_template_items: admins update"
  on public.checklist_template_items for update
  to authenticated
  using  (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

create policy "checklist_template_items: admins delete"
  on public.checklist_template_items for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: request_checklist_items
-- ============================================================

-- Parties on the request can see its checklist items
create policy "request_checklist_items: select"
  on public.request_checklist_items for select
  to authenticated
  using (
    request_id in (
      select id from public.procurement_requests
    )
    -- RLS on procurement_requests already gates this further
  );

-- Analysts insert/update checklist items on assigned requests
create policy "request_checklist_items: analysts insert"
  on public.request_checklist_items for insert
  to authenticated
  with check (
    public.current_role_name() in ('analyst', 'admin')
  );

create policy "request_checklist_items: analysts update"
  on public.request_checklist_items for update
  to authenticated
  using  (public.current_role_name() in ('analyst', 'admin'))
  with check (public.current_role_name() in ('analyst', 'admin'));

create policy "request_checklist_items: admins delete"
  on public.request_checklist_items for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: request_documents
-- ============================================================

-- Access mirrors the parent request's access
create policy "request_documents: select"
  on public.request_documents for select
  to authenticated
  using (
    request_id in (select id from public.procurement_requests)
  );

-- Vendors and agency users can upload documents to requests they can see
create policy "request_documents: insert"
  on public.request_documents for insert
  to authenticated
  with check (
    public.current_role_name() in ('vendor', 'agency_user', 'analyst', 'admin')
    and uploaded_by = auth.uid()
  );

-- Uploaders can update their own documents; analysts and admins can review
create policy "request_documents: update"
  on public.request_documents for update
  to authenticated
  using (
    uploaded_by = auth.uid()
    or public.current_role_name() in ('analyst', 'admin')
  )
  with check (
    uploaded_by = auth.uid()
    or public.current_role_name() in ('analyst', 'admin')
  );

-- Only admins may delete documents
create policy "request_documents: admins delete"
  on public.request_documents for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: comments
-- ============================================================

-- Internal comments only visible to analysts and admins;
-- external comments visible to all parties on the request
create policy "comments: select"
  on public.comments for select
  to authenticated
  using (
    (is_internal = false
      and request_id in (select id from public.procurement_requests))
    or (is_internal = true
      and public.current_role_name() in ('analyst', 'admin'))
  );

-- All authenticated users can comment on their visible requests
create policy "comments: insert"
  on public.comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and request_id in (select id from public.procurement_requests)
    -- vendors and agency_users cannot post internal notes
    and (
      is_internal = false
      or public.current_role_name() in ('analyst', 'admin')
    )
  );

-- Authors can edit their own comments; admins can edit any
create policy "comments: update"
  on public.comments for update
  to authenticated
  using (author_id = auth.uid() or public.current_role_name() = 'admin')
  with check (author_id = auth.uid() or public.current_role_name() = 'admin');

-- Authors can delete their own comments; admins can delete any
create policy "comments: delete"
  on public.comments for delete
  to authenticated
  using (author_id = auth.uid() or public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: review_actions (append-only)
-- ============================================================

-- All parties on the request can read review actions
create policy "review_actions: select"
  on public.review_actions for select
  to authenticated
  using (
    request_id in (select id from public.procurement_requests)
  );

-- Only analysts and admins can record review actions
create policy "review_actions: insert"
  on public.review_actions for insert
  to authenticated
  with check (
    public.current_role_name() in ('analyst', 'admin')
    and analyst_id = auth.uid()
  );

-- No UPDATE or DELETE policies — enforced by rules in migration 004

-- ============================================================
-- TABLE: status_history (append-only)
-- ============================================================

-- All parties on the request can read status history
create policy "status_history: select"
  on public.status_history for select
  to authenticated
  using (
    request_id in (select id from public.procurement_requests)
  );

-- Any authenticated user can append a status history entry
-- (application code guards which transitions are legal)
create policy "status_history: insert"
  on public.status_history for insert
  to authenticated
  with check (
    changed_by = auth.uid()
    and request_id in (select id from public.procurement_requests)
  );

-- No UPDATE or DELETE policies — enforced by rules in migration 004

-- ============================================================
-- TABLE: activity_log (append-only)
-- ============================================================

-- Analysts and admins can read the activity log
create policy "activity_log: analysts and admins read"
  on public.activity_log for select
  to authenticated
  using (public.current_role_name() in ('analyst', 'admin'));

-- Any authenticated user can append their own activity
create policy "activity_log: insert own"
  on public.activity_log for insert
  to authenticated
  with check (actor_id = auth.uid() or actor_id is null);

-- No UPDATE or DELETE policies — enforced by rules in migration 004

-- ============================================================
-- TABLE: notifications
-- ============================================================

-- Users can only read their own notifications
create policy "notifications: recipients read own"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

-- Application (service role) inserts notifications; admins too
create policy "notifications: admins insert"
  on public.notifications for insert
  to authenticated
  with check (public.current_role_name() = 'admin' or recipient_id = auth.uid());

-- Users can mark their own notifications as read
create policy "notifications: recipients update own"
  on public.notifications for update
  to authenticated
  using  (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Users can delete their own notifications; admins can delete any
create policy "notifications: delete"
  on public.notifications for delete
  to authenticated
  using (recipient_id = auth.uid() or public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: knowledge_articles
-- ============================================================

-- All authenticated users can read published articles
create policy "knowledge_articles: authenticated read published"
  on public.knowledge_articles for select
  to authenticated
  using (is_published = true or public.current_role_name() = 'admin');

-- Only admins can manage articles
create policy "knowledge_articles: admins insert"
  on public.knowledge_articles for insert
  to authenticated
  with check (public.current_role_name() = 'admin');

create policy "knowledge_articles: admins update"
  on public.knowledge_articles for update
  to authenticated
  using  (public.current_role_name() = 'admin')
  with check (public.current_role_name() = 'admin');

create policy "knowledge_articles: admins delete"
  on public.knowledge_articles for delete
  to authenticated
  using (public.current_role_name() = 'admin');

-- ============================================================
-- TABLE: feedback_items
-- ============================================================

-- Users can read their own feedback; admins can read all
create policy "feedback_items: select"
  on public.feedback_items for select
  to authenticated
  using (
    submitted_by = auth.uid()
    or public.current_role_name() = 'admin'
  );

-- Any authenticated user can submit feedback
create policy "feedback_items: insert"
  on public.feedback_items for insert
  to authenticated
  with check (submitted_by = auth.uid() or submitted_by is null);

-- Only admins can delete feedback
create policy "feedback_items: admins delete"
  on public.feedback_items for delete
  to authenticated
  using (public.current_role_name() = 'admin');
