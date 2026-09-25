-- ============================================================
-- 002 — Core Tables: organizations, profiles, vendor_profiles
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- organizations
-- Represents both agency organisations and vendor companies.
-- org_kind distinguishes which side of the marketplace an
-- organisation belongs to.
-- ──────────────────────────────────────────────────────────
create table public.organizations (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  kind          public.org_kind not null,
  description   text,
  website_url   text,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint organizations_name_unique unique (name)
);

comment on table public.organizations is
  'Agency and vendor organisations. kind distinguishes the two sides.';

-- ──────────────────────────────────────────────────────────
-- profiles
-- One row per authenticated Supabase user.  Joined to auth.users
-- via id (same UUID).  Stores role, display name, and which
-- organisation the user belongs to.
-- ──────────────────────────────────────────────────────────
create table public.profiles (
  id              uuid        primary key references auth.users (id) on delete cascade,
  organization_id uuid        references public.organizations (id) on delete set null,
  role            public.app_role not null,
  full_name       text        not null,
  email           text        not null,
  avatar_url      text,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint profiles_email_unique unique (email)
);

comment on table public.profiles is
  'One row per Supabase auth user. Links to an organization and carries the application role.';

-- ──────────────────────────────────────────────────────────
-- vendor_profiles
-- Extended metadata for users who are vendors.
-- One-to-one with profiles where role = ''vendor''.
-- ──────────────────────────────────────────────────────────
create table public.vendor_profiles (
  id                  uuid        primary key default gen_random_uuid(),
  profile_id          uuid        not null unique references public.profiles (id) on delete cascade,
  organization_id     uuid        not null references public.organizations (id) on delete cascade,
  business_number     text,
  contact_phone       text,
  primary_category    text,
  secondary_categories text[],
  is_verified         boolean     not null default false,
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.vendor_profiles is
  'Extended vendor metadata. One row per vendor user. org kind must be ''vendor''.';

-- ──────────────────────────────────────────────────────────
-- Trigger helper: keep updated_at current
-- ──────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_vendor_profiles_updated_at
  before update on public.vendor_profiles
  for each row execute function public.set_updated_at();
