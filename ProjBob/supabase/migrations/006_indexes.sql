-- ============================================================
-- 006 — Indexes for Common Filters
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- organizations
-- ──────────────────────────────────────────────────────────
create index idx_organizations_kind      on public.organizations (kind);
create index idx_organizations_is_active on public.organizations (is_active);

-- ──────────────────────────────────────────────────────────
-- profiles
-- ──────────────────────────────────────────────────────────
create index idx_profiles_organization_id on public.profiles (organization_id);
create index idx_profiles_role            on public.profiles (role);
create index idx_profiles_is_active       on public.profiles (is_active);

-- ──────────────────────────────────────────────────────────
-- vendor_profiles
-- ──────────────────────────────────────────────────────────
create index idx_vendor_profiles_organization_id on public.vendor_profiles (organization_id);
create index idx_vendor_profiles_is_verified     on public.vendor_profiles (is_verified);

-- ──────────────────────────────────────────────────────────
-- procurement_requests — primary query filters
-- ──────────────────────────────────────────────────────────

-- Status is the most common filter (queues, dashboards)
create index idx_pr_status           on public.procurement_requests (status);

-- Agency filter: "show all requests for my agency"
create index idx_pr_agency_org_id    on public.procurement_requests (agency_org_id);

-- Vendor filter: "show all requests assigned to my vendor"
create index idx_pr_vendor_org_id    on public.procurement_requests (vendor_org_id);

-- Analyst filter: "show requests assigned to me"
create index idx_pr_assigned_analyst on public.procurement_requests (assigned_analyst);

-- Category filter: browse/search by procurement category
create index idx_pr_category         on public.procurement_requests (category);

-- Deadline filter: upcoming deadlines dashboard
create index idx_pr_submission_deadline on public.procurement_requests (submission_deadline)
  where submission_deadline is not null;

-- Created date filter: time-range reporting
create index idx_pr_created_at       on public.procurement_requests (created_at desc);

-- Composite: analyst queue (status + analyst)
create index idx_pr_analyst_status   on public.procurement_requests (assigned_analyst, status)
  where assigned_analyst is not null;

-- Composite: agency dashboard (agency + status)
create index idx_pr_agency_status    on public.procurement_requests (agency_org_id, status);

-- submitted_by for "my submissions" view
create index idx_pr_submitted_by     on public.procurement_requests (submitted_by);

-- ──────────────────────────────────────────────────────────
-- checklist_templates
-- ──────────────────────────────────────────────────────────
create index idx_ct_category  on public.checklist_templates (category)
  where category is not null;
create index idx_ct_is_active on public.checklist_templates (is_active);

-- ──────────────────────────────────────────────────────────
-- request_checklist_items
-- ──────────────────────────────────────────────────────────
create index idx_rci_request_id on public.request_checklist_items (request_id);
create index idx_rci_status     on public.request_checklist_items (status);

-- ──────────────────────────────────────────────────────────
-- request_documents
-- ──────────────────────────────────────────────────────────
create index idx_rd_request_id      on public.request_documents (request_id);
create index idx_rd_uploaded_by     on public.request_documents (uploaded_by);
create index idx_rd_status          on public.request_documents (status);

-- ──────────────────────────────────────────────────────────
-- comments
-- ──────────────────────────────────────────────────────────
create index idx_comments_request_id on public.comments (request_id);
create index idx_comments_parent_id  on public.comments (parent_id)
  where parent_id is not null;
create index idx_comments_author_id  on public.comments (author_id);

-- ──────────────────────────────────────────────────────────
-- review_actions
-- ──────────────────────────────────────────────────────────
create index idx_ra_request_id  on public.review_actions (request_id);
create index idx_ra_analyst_id  on public.review_actions (analyst_id);
create index idx_ra_decision    on public.review_actions (decision);

-- ──────────────────────────────────────────────────────────
-- status_history
-- ──────────────────────────────────────────────────────────
create index idx_sh_request_id  on public.status_history (request_id);
create index idx_sh_created_at  on public.status_history (created_at desc);

-- ──────────────────────────────────────────────────────────
-- activity_log
-- ──────────────────────────────────────────────────────────
create index idx_al_actor_id    on public.activity_log (actor_id);
create index idx_al_request_id  on public.activity_log (request_id)
  where request_id is not null;
create index idx_al_event_type  on public.activity_log (event_type);
create index idx_al_created_at  on public.activity_log (created_at desc);

-- ──────────────────────────────────────────────────────────
-- notifications
-- ──────────────────────────────────────────────────────────
create index idx_notifications_recipient_id on public.notifications (recipient_id);
create index idx_notifications_is_read      on public.notifications (recipient_id, is_read)
  where is_read = false;

-- ──────────────────────────────────────────────────────────
-- knowledge_articles
-- ──────────────────────────────────────────────────────────
create index idx_ka_is_published on public.knowledge_articles (is_published);
create index idx_ka_category     on public.knowledge_articles (category)
  where category is not null;

-- ──────────────────────────────────────────────────────────
-- feedback_items
-- ──────────────────────────────────────────────────────────
create index idx_fi_article_id  on public.feedback_items (article_id)
  where article_id is not null;
create index idx_fi_request_id  on public.feedback_items (request_id)
  where request_id is not null;
