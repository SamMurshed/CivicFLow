-- ============================================================
-- 001 — Extensions & Enums
-- CivicFlow: fictional public-sector procurement platform
-- ============================================================

-- Enable uuid generation
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- Application role enum
-- ──────────────────────────────────────────────────────────
create type public.app_role as enum (
  'vendor',
  'agency_user',
  'analyst',
  'admin'
);

-- ──────────────────────────────────────────────────────────
-- Organization kind enum
-- ──────────────────────────────────────────────────────────
create type public.org_kind as enum (
  'agency',
  'vendor'
);

-- ──────────────────────────────────────────────────────────
-- Procurement request status enum
-- These mirror the workflow: submit → review → correct →
-- approve / reject, plus administrative statuses.
-- ──────────────────────────────────────────────────────────
create type public.request_status as enum (
  'draft',            -- Saved by agency user, not yet submitted
  'submitted',        -- Submitted for analyst review
  'under_review',     -- Analyst has opened the request
  'awaiting_correction', -- Analyst raised corrections; ball in vendor/agency court
  'correction_submitted', -- Vendor/agency resubmitted after corrections
  'approved',         -- Analyst issued approval
  'rejected',         -- Analyst issued rejection
  'withdrawn',        -- Agency user withdrew the request
  'on_hold'           -- Placed on administrative hold
);

-- ──────────────────────────────────────────────────────────
-- Checklist item status enum
-- ──────────────────────────────────────────────────────────
create type public.checklist_item_status as enum (
  'pending',
  'satisfied',
  'flagged',
  'waived'
);

-- ──────────────────────────────────────────────────────────
-- Document status enum
-- ──────────────────────────────────────────────────────────
create type public.document_status as enum (
  'uploaded',
  'accepted',
  'rejected',
  'superseded'
);

-- ──────────────────────────────────────────────────────────
-- Review decision enum
-- ──────────────────────────────────────────────────────────
create type public.review_decision as enum (
  'request_correction',
  'approve',
  'reject',
  'place_on_hold',
  'resume_from_hold'
);
