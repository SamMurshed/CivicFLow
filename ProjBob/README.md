# CivicFlow

> **Demonstration project — all data, names, and scenarios are entirely fictional.**

---

## Project Purpose

CivicFlow is a fictional public-sector procurement operations platform built to demonstrate how four distinct actor types — Vendors, Agency Users, Procurement Analysts, and Administrators — collaborate across the full lifecycle of a procurement request.

The platform models the journey from initial submission through structured review, iterative correction, final approval, and post-decision reporting. It is designed to illustrate role-based access control, multi-step workflow management, checklist-driven review, and audit-trail reporting in a realistic but entirely invented context.

**This is a demonstration and learning platform. It contains no real procurement data, no real government information, and no connection to any actual public-sector system.**

---

## Planned Users

| Role | Responsibilities |
|---|---|
| **Vendor** | Maintains a vendor profile, submits requested information and documents, responds to correction items raised by analysts, and tracks the status of procurement requests they are attached to. |
| **Agency User** | Creates procurement requests, selects and attaches a vendor, supplies project details and budget information, and responds to questions or correction requests raised by procurement analysts. |
| **Procurement Analyst** | Reviews submissions against a defined checklist, requests corrections from vendors or agency users, records review actions and notes, and issues a final approve or reject decision. |
| **Administrator** | Manages organisations, users, checklist templates, and knowledge articles. Views system-wide reporting and audit trails across all requests and decisions. |

---

## Proposed Workflow

1. **Submit** — An agency user creates a new procurement request, provides project and budget details, and attaches a vendor. The completed submission enters the review queue.
2. **Review** — A procurement analyst is assigned the request and evaluates it against a checklist of required information. They record observations and determine whether corrections are needed.
3. **Correct** — The analyst raises specific correction items identifying missing or insufficient information. The assigned vendor and/or agency user receives notification, provides the requested information or documents, and marks each correction item as resolved.
4. **Approve** — Once all corrections are resolved and the checklist is satisfied, the analyst issues a final decision: **Approved** or **Rejected**. The decision is recorded with a rationale and timestamp.
5. **Report** — Administrators and analysts access reporting dashboards and audit trails showing submission volumes, decision outcomes, correction cycle times, and a full immutable history of every action taken on each request.

---

## Technology Stack

| Technology | Role |
|---|---|
| **Next.js 16 — App Router** | Full-stack React framework; all pages use the App Router convention under `src/app/`. |
| **TypeScript (strict mode)** | Statically typed throughout; `tsconfig.json` has `"strict": true`. |
| **Tailwind CSS v4** | Utility-first styling; no external component library is used. |
| **Vitest + React Testing Library** | Fast unit and component testing with jsdom; replaces Jest. |
| **Prettier** | Automatic code formatting with `prettier-plugin-tailwindcss` for class sorting. |
| **Supabase** | Backend database and auth (`@supabase/supabase-js` + `@supabase/ssr`). Browser and server clients are wired up; credentials are supplied via `.env.local`. |

---

## Local Development Commands

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start the Next.js development server at `http://localhost:3000`. |
| `build` | `npm run build` | Compile a production build. |
| `start` | `npm run start` | Start the production server (requires a prior `build`). |
| `lint` | `npm run lint` | Run ESLint via `next lint`. |
| `typecheck` | `npm run typecheck` | Run TypeScript compiler check without emitting files (`tsc --noEmit`). |
| `test` | `npm run test` | Run the full Vitest test suite once. |
| `test:watch` | `npm run test:watch` | Run Vitest in interactive watch mode. |
| `format` | `npm run format` | Format all files with Prettier. |
| `format:check` | `npm run format:check` | Check formatting without writing changes (useful in CI). |

### Quick start

```bash
cp .env.example .env.local   # fill in your Supabase credentials (see below)
npm install
npm run dev
```

---

## Supabase Setup

### 1 — Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**, choose an organisation, pick a name (e.g. `civicflow-dev`), set a strong database password, and select the region closest to you.
3. Wait ~2 minutes for the project to provision.

### 2 — Copy your API credentials

1. In the Supabase dashboard open **Project Settings → API**.
2. Copy the **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`).
3. Copy the **anon / public** key (the long JWT under "Project API keys").

> ⚠️ Never copy the **service_role** key into `.env.example` or client-side code.
> It bypasses Row-Level Security and must only be used in trusted server environments.

### 3 — Add credentials to your local environment

Open `.env.local` (created from `.env.example` above) and fill in the two values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Restart the dev server after editing `.env.local`.

### 4 — Verify connectivity

Open [http://localhost:3000/system-status](http://localhost:3000/system-status) in your browser.
All four rows should show **OK** once valid credentials are in place.

> The `/system-status` page is only available in `development` mode and returns 404 in production.

---

## Database Schema

CivicFlow uses a Supabase (PostgreSQL) relational database. Migrations live in `supabase/migrations/` and must be applied in numeric order.

### Migrations

| File | Description |
|---|---|
| `001_extensions_and_enums.sql` | Enables `pgcrypto`; defines `app_role`, `org_kind`, `request_status`, `checklist_item_status`, `document_status`, and `review_decision` enum types. |
| `002_core_tables.sql` | Creates `organizations`, `profiles`, and `vendor_profiles`; adds the `set_updated_at()` trigger function. |
| `003_procurement_tables.sql` | Creates `procurement_requests`, `checklist_templates`, `checklist_template_items`, `request_checklist_items`, and `request_documents`. |
| `004_workflow_tables.sql` | Creates `comments`, `review_actions`, `status_history`, and `activity_log`; append-only tables have PostgreSQL rules that silently block UPDATE and DELETE. |
| `005_supporting_tables.sql` | Creates `notifications`, `knowledge_articles`, and `feedback_items`. |
| `006_indexes.sql` | Creates indexes for the most common query filters: status, agency, vendor, analyst, category, deadline, and created date. |
| `007_rls_policies.sql` | Enables Row Level Security on every table and defines per-role access policies. |

### Key Design Decisions

- **UUID primary keys** — all tables use `gen_random_uuid()` as the default primary key.
- **Exact money** — `proposed_budget` uses `numeric(15,2)`, never `float` or `real`.
- **Append-only audit tables** — `status_history`, `activity_log`, and `review_actions` have PostgreSQL `DO INSTEAD NOTHING` rules on `UPDATE` and `DELETE`, making them immutable at the database level.
- **Role-scoped RLS** — Four application roles (`vendor`, `agency_user`, `analyst`, `admin`) control every table via `USING` and `WITH CHECK` expressions. Helper functions (`current_role_name()`, `current_org_id()`) are `SECURITY DEFINER` and stable, so they are evaluated once per query.

### Tables at a Glance

| Table | Purpose |
|---|---|
| `organizations` | Both agency and vendor organisations. `kind` column distinguishes them. |
| `profiles` | One row per authenticated user; carries `app_role` and links to an organisation. |
| `vendor_profiles` | Extended vendor metadata (business number, categories, verification status). |
| `procurement_requests` | Central fact table; tracks the full lifecycle from `draft` to `approved`/`rejected`. |
| `checklist_templates` | Reusable analyst review checklists managed by admins. |
| `checklist_template_items` | Individual items within a checklist template. |
| `request_checklist_items` | Live per-request copy of checklist items; mutated by analysts during review. |
| `request_documents` | Metadata for files uploaded to a request (file stored in Supabase Storage). |
| `comments` | Threaded discussion on a request; `is_internal` flags analyst-only notes. |
| `review_actions` | Immutable log of every formal analyst decision (approve, reject, flag, etc.). |
| `status_history` | Append-only record of every status transition. |
| `activity_log` | Append-only structured audit log for all significant application events. |
| `notifications` | In-app notifications for individual users. |
| `knowledge_articles` | Help-centre articles managed by admins. |
| `feedback_items` | User ratings and comments on articles or requests. |

### Request Status Lifecycle

```
draft → submitted → under_review ─┬→ approved
                                   ├→ rejected
                                   └→ awaiting_correction → correction_submitted → under_review (loop)

Any status → withdrawn   (agency user withdraws)
Any status → on_hold     (administrative hold)
```

### Applying Migrations to a New Project

```bash
# Using the Supabase CLI (recommended)
npx supabase db push

# Or run each file manually in the Supabase SQL editor in order:
# 001 → 002 → 003 → 004 → 005 → 006 → 007
# Then run: supabase/seed/seed.sql
```

### Generating TypeScript Types

```bash
npx supabase gen types typescript \
  --project-id <YOUR_PROJECT_ID> \
  --schema public \
  > src/types/database.ts
```

The generated file replaces `src/types/database.ts`. The manually maintained version in the repository is the authoritative reference until a live project is connected.

---

## Demo Accounts

CivicFlow does not offer public self-registration. The four fictional demo accounts must be
created through the Supabase Auth API (or dashboard) and then connected to the pre-existing
seed profile rows.

### Four demo accounts

| Role | Email | Supabase Auth password |
|---|---|---|
| **Administrator** | `admin@civicflow.example` | `Demo1234!` |
| **Procurement Analyst** | `analyst.morgan@civicflow.example` | `Demo1234!` |
| **Agency User** | `agency.thornton@northdale.example` | `Demo1234!` |
| **Vendor** | `vendor.chen@apex.example` | `Demo1234!` |

> ⚠️ These passwords are fictional demonstration values. Change them before connecting to any
> real environment.

### How to create the accounts

The seed script (`supabase/seed/seed.sql`) inserts stub rows into `auth.users` with
deterministic UUIDs and blank passwords — suitable for local SQL-only runs. For a live
Supabase project you must create real Auth users and point them at the same UUIDs.

#### Option A — Supabase CLI (recommended for local dev)

```bash
# 1. Apply migrations and seed
npx supabase db reset          # runs all migrations + seed.sql automatically

# The stub auth.users rows inserted by seed.sql already have the correct UUIDs.
# Update their passwords so you can sign in:
npx supabase db execute --file supabase/scripts/create_demo_passwords.sql
```

See `supabase/scripts/create_demo_passwords.sql` for the password-update statements.

#### Option B — Supabase dashboard (cloud project)

1. Open **Authentication → Users** in the Supabase dashboard.
2. Click **Invite user** (or **Add user**) for each of the four emails above, setting
   the password to `Demo1234!`.
   The UUID Supabase assigns to each new Auth user **must match** the seed UUID.
   The easiest way is to run `seed.sql` (step 2 below) which inserts stub rows with
   the fixed UUIDs, then update the password using the Supabase SQL editor:

   ```sql
   -- Run in the Supabase SQL editor (requires service-role access)
   update auth.users
   set    encrypted_password = crypt('Demo1234!', gen_salt('bf'))
   where  email in (
     'admin@civicflow.example',
     'analyst.morgan@civicflow.example',
     'agency.thornton@northdale.example',
     'vendor.chen@apex.example'
   );
   ```

3. Apply all migrations then run the seed file:

   ```bash
   npx supabase db push
   npx supabase db execute --file supabase/seed/seed.sql
   ```

### Sign-in destinations

Each role lands on its own dashboard immediately after signing in:

| Role | Dashboard path |
|---|---|
| Vendor | `/vendor/dashboard` |
| Agency User | `/agency/dashboard` |
| Procurement Analyst | `/analyst/dashboard` |
| Administrator | `/admin/dashboard` |

---

## Synthetic-Data Restriction

> ⚠️ **No real data may be committed to this repository.**
>
> No real procurement data, vendor names, personal information, agency names, employee names, budget figures, or government data of any kind may be committed to this repository at any time.
>
> All test fixtures, seed scripts, seed data, example values, and demonstration content **must be clearly fictional and invented solely for demonstration purposes**. If a name, number, or identifier could plausibly correspond to a real entity, it must not be used.
>
> This restriction applies to all branches, commits, pull requests, and issue comments in this repository.

---

*CivicFlow is a fictional demonstration platform. Any resemblance to real procurement systems, agencies, vendors, or processes is coincidental.*
