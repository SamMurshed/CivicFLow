-- Add the display order used by checklist creation, review screens, and seed data.
-- IF NOT EXISTS keeps this safe for databases where the column was added manually.

alter table public.request_checklist_items
  add column if not exists sort_order smallint not null default 0;

