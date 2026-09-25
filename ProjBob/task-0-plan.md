# Task 0 — Repository and Development Foundation Plan

## Overview

Bootstrap a greenfield **CivicFlow** Next.js 15 application that is ready for feature development but contains no business logic, no authentication implementation, and no external service connections yet.

CivicFlow is a fictional public-sector procurement operations platform. Four actor types — Vendor, Agency User, Procurement Analyst, and Administrator — collaborate to submit, review, correct, approve, and report on procurement requests.

**Scope:** project scaffold only — tooling, folder structure, landing page, and passing CI scripts.  
**Out of scope:** Supabase, authentication, any business feature, component libraries (e.g. shadcn, MUI, Chakra).

---

## Sub-Tasks

---

### ST-1 — Scaffold the Next.js 15 Project

**Intent**  
Initialise a Next.js 15 App Router project with TypeScript, Tailwind CSS, ESLint, and a `src/` directory using `create-next-app`. This is the foundation every other sub-task builds on.

**Expected Outcomes**

- `package.json` exists with Next.js 15, React 19, TypeScript, Tailwind CSS, and ESLint as dependencies.
- `src/app/layout.tsx` and `src/app/page.tsx` exist (App Router convention).
- `next.config.ts` exists.
- `tailwind.config.ts` and `postcss.config.mjs` exist and reference the `src/` directory.
- `tsconfig.json` exists with `strict: true` and path alias `@/*` pointing to `src/*`.

**Todo List**

1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack` in the workspace root (the directory already has a blank `readme.md`; the tool should not re-initialise git).
2. Verify `tsconfig.json` has `"strict": true` under `compilerOptions`; add it if missing.
3. Confirm `tailwind.config.ts` content array includes `./src/**/*.{ts,tsx}`.

**Relevant Context**

- Workspace root: `c:\Users\samin\OneDrive\Desktop\ProjBob`
- Only `readme.md` (blank) exists today — safe to scaffold into the same directory.
- Node 20 LTS / npm / Next.js 15 latest stable.

**Status:** [ ] pending

---

### ST-2 — Establish Folder Structure

**Intent**  
Create the empty directory skeleton (with `.gitkeep` placeholders) that signals to future developers where each concern lives. Establishing this now prevents ad-hoc folder sprawl later.

**Expected Outcomes**  
The following directories exist under `src/`:

```
src/
  app/               # Next.js App Router pages and layouts (already created by scaffold)
  components/        # Shared React UI components
    ui/              # Primitive design-system atoms (Button, Card, Badge, etc.)
  lib/               # General-purpose utilities (dates, formatting, cn helper)
  validation/        # Zod schemas — one file per domain entity
  db/                # Database access layer (queries, mutations) — empty until Supabase task
  hooks/             # Custom React hooks
  types/             # Shared TypeScript type definitions
  __tests__/         # Vitest + React Testing Library test files
```

**Todo List**

1. Create the above directories with `.gitkeep` placeholder files so git tracks them.
2. Do not add any source code yet — structure only.

**Relevant Context**

- `src/app/` will already exist after ST-1.
- `src/components/ui/` is intentionally separate from `src/components/` to distinguish primitives from feature-level composites.

**Status:** [ ] pending

---

### ST-3 — Add Prettier and Refine npm Scripts

**Intent**  
Consistent formatting and a complete set of npm scripts ensure every contributor runs the same checks. This closes the gap between what `create-next-app` provides and what the acceptance criteria require.

**Expected Outcomes**

- `prettier`, `prettier-plugin-tailwindcss` installed as dev dependencies.
- `.prettierrc` file present with a minimal, agreed config.
- `.prettierignore` excludes build artefacts.
- `package.json` scripts include:
  - `dev` — `next dev`
  - `build` — `next build`
  - `start` — `next start`
  - `lint` — `next lint`
  - `typecheck` — `tsc --noEmit`
  - `test` — `vitest run`
  - `test:watch` — `vitest`
  - `format` — `prettier --write .`
  - `format:check` — `prettier --check .`

**Todo List**

1. Install `prettier` and `prettier-plugin-tailwindcss` as dev dependencies.
2. Create `.prettierrc` (JSON) with: `printWidth: 100`, `singleQuote: true`, `trailingComma: "all"`, `plugins: ["prettier-plugin-tailwindcss"]`.
3. Create `.prettierignore` excluding `.next/`, `node_modules/`, and `out/`.
4. Update `package.json` scripts to include `typecheck`, `test`, `test:watch`, `format`, and `format:check` (keep existing `dev`, `build`, `start`, `lint`).

**Relevant Context**

- `prettier-plugin-tailwindcss` automatically sorts Tailwind class names — important for a consistent design system later.
- `typecheck` runs `tsc --noEmit`; Next.js ships its own `tsconfig` that includes all `src/` files.

**Status:** [ ] pending

---

### ST-4 — Configure Vitest and React Testing Library

**Intent**  
Next.js 15 uses Turbopack/Webpack internally; Vitest with jsdom provides a fast, Jest-compatible test runner that integrates with React Testing Library without requiring a full browser.

**Expected Outcomes**

- `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` installed as dev dependencies.
- `vitest.config.ts` present, pointing at `jsdom` environment and including a setup file.
- `src/tests/setup.ts` (or `src/__tests__/setup.ts`) that imports `@testing-library/jest-dom`.
- `tsconfig.json` includes the jest-dom types.
- One passing smoke test at `src/__tests__/smoke.test.tsx` that renders a trivial component and asserts it appears in the DOM.
- `npm run test` exits 0.

**Todo List**

1. Install dev dependencies: `vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`.
2. Create `vitest.config.ts` with `environment: 'jsdom'`, `setupFiles: ['./src/__tests__/setup.ts']`, and a `resolve.alias` for the `@/` path that mirrors `tsconfig`.
3. Create `src/__tests__/setup.ts` that imports `@testing-library/jest-dom`.
4. Add `"types": ["@testing-library/jest-dom"]` to `tsconfig.json` `compilerOptions`.
5. Write `src/__tests__/smoke.test.tsx`: render a `<div>CivicFlow</div>` and assert `getByText('CivicFlow')` is in the document.
6. Run `npm run test` and confirm it passes.

**Relevant Context**

- `vitest.config.ts` must alias `@/` → `./src/` to match Next.js path aliases, otherwise imports inside tested components will fail.
- `@testing-library/jest-dom` extends Vitest's `expect` via the setup file import.

**Status:** [ ] pending

---

### ST-5 — Build the Landing Page

**Intent**  
The landing page is the first thing any visitor sees. It must clearly explain what CivicFlow is, who uses it, and what the workflow looks like — in plain language. Placeholder navigation links (Sign In, View Demo) must be present but not wired to any route yet.

**Expected Outcomes**

- `src/app/page.tsx` contains a fully accessible, responsive landing page.
- Page includes: site name/logo text, one-line tagline, a plain-language description of the platform, a summary of the four user roles, a high-level workflow summary (submit → review → correct → approve → report), and two CTAs: **Sign In** (`href="/sign-in"`) and **View Demo** (`href="/demo"`).
- `/sign-in` and `/demo` routes do NOT exist yet — links are intentional placeholders.
- `src/app/layout.tsx` sets a meaningful `<title>` and `<meta name="description">`.
- Page is responsive (mobile-first Tailwind classes) and passes basic accessibility (semantic HTML, landmark roles, visible focus ring on links).
- No external UI library is used — plain Tailwind only.

**Todo List**

1. Update `src/app/layout.tsx`: set `title: 'CivicFlow'`, add a meta description, keep the existing font/body setup but remove any boilerplate Next.js demo content.
2. Replace the contents of `src/app/page.tsx` with the landing page:
   - `<header>` with logo text and nav containing Sign In and View Demo links.
   - `<main>` with hero section (tagline + description), roles section (four role cards), and workflow section (numbered steps).
   - `<footer>` with a short copyright line.
3. Use only Tailwind utility classes — no inline styles, no external component imports.
4. Confirm the page renders at `localhost:3000` when `npm run dev` runs.

**Relevant Context**

- The four roles: Vendor, Agency User, Procurement Analyst, Administrator.
- The five workflow stages: Submit → Review → Correct → Approve → Report.
- Accessibility: use `<nav>`, `<main>`, `<header>`, `<footer>` landmarks; links need `aria-label` if icon-only (none here); Tailwind's `focus:ring` on interactive elements.

**Status:** [ ] pending

---

### ST-6 — Add Environment Files and .gitignore

**Intent**  
Define the expected environment variable surface now, before any secrets are introduced, so contributors always know which variables to provide.

**Expected Outcomes**

- `.env.example` exists with commented placeholder keys for anticipated variables (Supabase URL, Supabase anon key, app URL) — no real values.
- `.env.local` is listed in `.gitignore` (and is not committed).
- `.gitignore` covers standard Next.js, Node, OS, and editor artefacts.
- No secrets or real data appear anywhere in the repository.

**Todo List**

1. Check whether `create-next-app` already generated a `.gitignore`; if so, verify it includes `.env*.local`. Add any missing patterns (`.env.local`, `.env.development.local`, `*.log`, `.DS_Store`, `.idea/`, `.vscode/` except `extensions.json`).
2. Create `.env.example`:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Confirm `.env.local` does NOT exist (nothing to leak).

**Relevant Context**

- `create-next-app` generates a `.gitignore` that already covers most Next.js artefacts; this sub-task audits and extends it.
- Supabase keys are the only anticipated secret surface for Task 1+.

**Status:** [ ] pending

---

### ST-7 — Write the README

**Intent**  
The README is the authoritative onboarding document. It must describe purpose, users, workflow, stack, local commands, and the synthetic-data restriction as required by the acceptance criteria.

**Expected Outcomes**

- `README.md` (replaces the current blank `readme.md`) contains all required sections.
- Sections: Project Purpose, Planned Users (four roles), Proposed Workflow, Technology Stack, Local Development Commands, Synthetic-Data Restriction.
- All `npm run` commands match what was configured in ST-3.
- No placeholder text left unfilled.

**Todo List**

1. Delete (overwrite) the existing blank `readme.md` with a new `README.md` containing all required sections.
2. Sections must include:
   - **Project Purpose** — what CivicFlow is and the problem it solves.
   - **Planned Users** — Vendor, Agency User, Procurement Analyst, Administrator with one-line descriptions.
   - **Proposed Workflow** — Submit → Review → Correct → Approve → Report as a numbered list with brief descriptions of each stage.
   - **Technology Stack** — Next.js 15 App Router, TypeScript (strict), Tailwind CSS, Vitest, React Testing Library, Prettier, Supabase (planned).
   - **Local Development Commands** — table of all `npm run` scripts with descriptions.
   - **Synthetic-Data Restriction** — explicit statement that no real procurement data, vendor names, personal information, or government data may be committed; all test fixtures must be clearly fictional.

**Relevant Context**

- The blank `readme.md` at the root is the only existing file before scaffolding.
- After ST-1, `create-next-app` may generate its own `README.md`; this sub-task overwrites it entirely.

**Status:** [ ] pending

---

### ST-8 — Final Validation Pass

**Intent**  
Run every acceptance-criteria check in sequence and confirm all five pass cleanly before declaring Task 0 complete.

**Expected Outcomes**

- `npm run dev` starts without errors.
- `npm run lint` exits 0 with no warnings.
- `npm run typecheck` exits 0.
- `npm run test` exits 0 (smoke test passes).
- `npm run build` exits 0 (static export compiles cleanly).
- Landing page is visible and responsive at `localhost:3000`.
- No secrets or real data present anywhere.

**Todo List**

1. Run `npm run lint` — fix any ESLint errors (likely unused imports from scaffold boilerplate).
2. Run `npm run typecheck` — fix any type errors.
3. Run `npm run test` — confirm smoke test passes.
4. Run `npm run build` — confirm production build succeeds.
5. Visually inspect the landing page at `localhost:3000` after `npm run dev`.
6. `grep` the repo for any strings that look like real keys, emails, or personal data — confirm none found.

**Relevant Context**

- Build may fail if any `page.tsx` uses client-only APIs without `"use client"` directive.
- ESLint config from `create-next-app` uses `eslint-config-next`; no custom rules needed yet.

**Status:** [ ] pending

---

## Dependency Order

```
ST-1 (scaffold)
  └── ST-2 (folders)
  └── ST-3 (prettier + scripts)
        └── ST-4 (vitest)
        └── ST-5 (landing page)
        └── ST-6 (env files)
        └── ST-7 (README)
              └── ST-8 (final validation)
```

ST-2 through ST-7 can proceed in any order after ST-1 completes. ST-8 must be last.
