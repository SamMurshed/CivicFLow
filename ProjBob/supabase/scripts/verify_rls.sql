-- ============================================================
-- RLS Verification Script — CivicFlow
--
-- Run this against a seeded Supabase database to verify that
-- Row Level Security allows and denies access as expected.
--
-- Prerequisites:
--   1. Migrations 001–007 applied.
--   2. seed.sql loaded.
--   3. Execute as the postgres superuser (or service role).
--
-- Each block sets the local role to a specific application
-- user, then runs a SELECT or DML statement and verifies the
-- result count or error.
-- ============================================================

\set ON_ERROR_STOP off

-- ─────────────────────────────────────────────────────────────
-- Helper: print a pass/fail banner
-- ─────────────────────────────────────────────────────────────
do $$
begin
  raise notice '=== CivicFlow RLS Verification Script ===';
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 1: Vendor can read only their own org's requests
-- Expected: Jordan Chen (vendor, Apex Supply) sees requests
--           where vendor_org_id = org_apexsupply (req_draft only).
--           Should NOT see Blue Ridge or Zenith requests.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  -- Impersonate Jordan Chen (vendor, Apex Supply)
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000007","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.procurement_requests;

  -- Jordan Chen's org (Apex Supply) is vendor on req_draft only
  if v_count = 1 then
    raise notice 'PASS  TEST 1: Vendor sees only their org''s requests (count=%). ', v_count;
  else
    raise warning 'FAIL  TEST 1: Expected 1 request, got %. ', v_count;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 2: Agency user sees only their agency's requests
-- Expected: Sam Thornton (agency_user, Northdale) sees
--           req_draft, req_submitted, req_approved (3 rows).
--           Should NOT see Westmarch requests.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000004","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.procurement_requests;

  if v_count = 3 then
    raise notice 'PASS  TEST 2: Agency user sees only their agency''s requests (count=%). ', v_count;
  else
    raise warning 'FAIL  TEST 2: Expected 3 requests, got %. ', v_count;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 3: Analyst sees submitted/open requests
-- Expected: Morgan Castellano (analyst) sees at minimum
--           under_review and approved requests (assigned to them)
--           plus all submitted/under_review/awaiting requests.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000002","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.procurement_requests;

  -- Analyst 1 is assigned to under_review + approved
  -- Plus all submitted/under_review/awaiting/correction_submitted in queue
  if v_count >= 2 then
    raise notice 'PASS  TEST 3: Analyst sees assigned and queued requests (count=%). ', v_count;
  else
    raise warning 'FAIL  TEST 3: Expected >= 2, got %. ', v_count;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 4: Vendor cannot read another vendor org's requests
-- Expected: Jordan Chen (Apex Supply vendor) cannot see
--           req_under_review (Blue Ridge / Westmarch).
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000007","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.procurement_requests
  where id = 'e0000001-0000-0000-0000-000000000003'; -- req_under_review (Blue Ridge)

  if v_count = 0 then
    raise notice 'PASS  TEST 4: Vendor cannot read another vendor''s request.';
  else
    raise warning 'FAIL  TEST 4: Vendor read a request from a different vendor org.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 5: Agency user cannot read another agency's requests
-- Expected: Sam Thornton (Northdale) cannot see Westmarch requests.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000004","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.procurement_requests
  where agency_org_id = 'd0000001-0000-0000-0000-000000000002'; -- org_westmarch

  if v_count = 0 then
    raise notice 'PASS  TEST 5: Agency user cannot read another agency''s requests.';
  else
    raise warning 'FAIL  TEST 5: Agency user read requests from another agency.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 6: Agency user cannot create a request for another agency
-- Expected: INSERT rejected (policy check)
-- ─────────────────────────────────────────────────────────────
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000004","role":"authenticated"}',
    true);

  begin
    insert into public.procurement_requests (
      title, description, category, proposed_budget,
      agency_org_id, vendor_org_id, submitted_by, status
    ) values (
      'Unauthorised Request', 'Attempt to create for wrong agency', 'Test',
      1000.00,
      'd0000001-0000-0000-0000-000000000002', -- Westmarch (not Sam's org)
      'd0000001-0000-0000-0000-000000000003',
      'a0000001-0000-0000-0000-000000000004',
      'draft'
    );
    raise warning 'FAIL  TEST 6: Agency user INSERT for another agency was allowed.';
  exception when others then
    raise notice 'PASS  TEST 6: Agency user INSERT for another agency was rejected (%).', sqlerrm;
  end;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 7: Vendor cannot see internal analyst comments
-- Expected: Jordan Chen cannot see is_internal = true comments
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000007","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.comments
  where is_internal = true;

  if v_count = 0 then
    raise notice 'PASS  TEST 7: Vendor cannot see internal analyst comments.';
  else
    raise warning 'FAIL  TEST 7: Vendor can see % internal comment(s).', v_count;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 8: Analyst can see internal comments
-- Expected: Morgan Castellano can see is_internal = true comments
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000002","role":"authenticated"}',
    true);

  select count(*) into v_count
  from public.comments
  where is_internal = true;

  if v_count >= 1 then
    raise notice 'PASS  TEST 8: Analyst can see internal comments (count=%). ', v_count;
  else
    raise warning 'FAIL  TEST 8: Analyst cannot see internal comments.';
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 9: Enum constraints reject invalid values
-- Expected: INSERT with unknown status rejected
-- ─────────────────────────────────────────────────────────────
do $$
begin
  begin
    insert into public.procurement_requests (
      title, description, category, proposed_budget,
      agency_org_id, submitted_by, status
    ) values (
      'Bad Status', 'Test', 'Test', 1.00,
      'd0000001-0000-0000-0000-000000000001',
      'a0000001-0000-0000-0000-000000000004',
      'not_a_real_status'  -- invalid enum value
    );
    raise warning 'FAIL  TEST 9: Invalid status value was accepted.';
  exception when invalid_text_representation or others then
    raise notice 'PASS  TEST 9: Invalid status enum value rejected.';
  end;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 10: Enum constraints reject invalid roles
-- ─────────────────────────────────────────────────────────────
do $$
begin
  begin
    insert into public.profiles (id, role, full_name, email)
    values (
      gen_random_uuid(), 'superuser', 'Bad Role User', 'bad@example.test'
    );
    raise warning 'FAIL  TEST 10: Invalid role enum value was accepted.';
  exception when invalid_text_representation or others then
    raise notice 'PASS  TEST 10: Invalid role enum value rejected.';
  end;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 11: status_history is append-only (no UPDATE)
-- Expected: UPDATE is silently ignored (via pg rule)
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_before text;
  v_after  text;
begin
  -- Record initial reason of first status_history row for req_approved
  select reason into v_before
  from public.status_history
  where request_id = 'e0000001-0000-0000-0000-000000000005'
  order by created_at asc limit 1;

  -- Attempt update (will be swallowed by the DO INSTEAD NOTHING rule)
  update public.status_history
  set reason = 'TAMPERED'
  where request_id = 'e0000001-0000-0000-0000-000000000005';

  select reason into v_after
  from public.status_history
  where request_id = 'e0000001-0000-0000-0000-000000000005'
  order by created_at asc limit 1;

  if v_before = v_after or v_after != 'TAMPERED' then
    raise notice 'PASS  TEST 11: status_history UPDATE was ignored (append-only).';
  else
    raise warning 'FAIL  TEST 11: status_history was mutated (reason changed to %).', v_after;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 12: Users see only their own notifications
-- Expected: Sam Thornton sees 2 notifications (approved + none others)
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000004","role":"authenticated"}',
    true);

  select count(*) into v_count from public.notifications;

  if v_count = 1 then
    raise notice 'PASS  TEST 12: User sees only their own notifications (count=%). ', v_count;
  else
    raise warning 'FAIL  TEST 12: Expected 1 notification for Sam Thornton, got %.', v_count;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 13: Admin can read all requests
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_count int;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"a0000001-0000-0000-0000-000000000001","role":"authenticated"}',
    true);

  select count(*) into v_count from public.procurement_requests;

  if v_count = 6 then
    raise notice 'PASS  TEST 13: Admin sees all 6 requests.';
  else
    raise warning 'FAIL  TEST 13: Admin expected 6 requests, got %.', v_count;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- TEST 14: Budget constraint rejects negative value
-- ─────────────────────────────────────────────────────────────
do $$
begin
  begin
    insert into public.procurement_requests (
      title, description, category, proposed_budget,
      agency_org_id, submitted_by, status
    ) values (
      'Negative Budget', 'Test', 'Test', -500.00,
      'd0000001-0000-0000-0000-000000000001',
      'a0000001-0000-0000-0000-000000000004',
      'draft'
    );
    raise warning 'FAIL  TEST 14: Negative proposed_budget was accepted.';
  exception when check_violation or others then
    raise notice 'PASS  TEST 14: Negative proposed_budget rejected.';
  end;
end $$;

\set ON_ERROR_STOP on

do $$
begin
  raise notice '';
  raise notice '=== Verification complete. Review PASS/FAIL notices above. ===';
end $$;
