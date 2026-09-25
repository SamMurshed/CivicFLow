-- ============================================================
-- create_demo_passwords.sql
--
-- Sets passwords for the four fictional demo accounts.
-- Run AFTER seed.sql has inserted the stub auth.users rows.
--
-- These are fictional demonstration values only.
-- Run as postgres / service role (bypasses RLS).
-- ============================================================

set local role postgres;

update auth.users
set    encrypted_password = crypt('Demo1234!', gen_salt('bf')),
       email_confirmed_at = coalesce(email_confirmed_at, now()),
       updated_at         = now()
where  email in (
  'admin@civicflow.example',
  'analyst.morgan@civicflow.example',
  'agency.thornton@northdale.example',
  'vendor.chen@apex.example'
);

reset role;
