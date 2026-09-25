# Architecture

```mermaid
flowchart TB
  Browser[Next.js UI] --> Actions[Server Actions and Route Handlers]
  Actions --> DAL[Authorization and Data Access Layer]
  DAL --> Auth[Supabase Auth]
  DAL --> DB[(PostgreSQL with RLS)]
  DAL --> Storage[(Private Supabase Storage)]
  DB --> Audit[Append-only history and activity]
```

## Request workflow

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted: Required documents attached
  Submitted --> UnderReview: Analyst claims request
  UnderReview --> AwaitingCorrection: Flagged items
  AwaitingCorrection --> CorrectionSubmitted: Applicant resubmits
  CorrectionSubmitted --> UnderReview: Analyst resumes review
  UnderReview --> Approved: Required items satisfied or waived
  UnderReview --> Rejected: Rationale recorded
  UnderReview --> OnHold
  OnHold --> UnderReview
```

## Trust boundaries

- Browser input is untrusted. Server Actions authenticate, authorize, and validate every mutation.
- PostgreSQL Row Level Security independently limits readable and writable rows.
- Uploaded files remain in a private bucket. Downloads use short-lived signed URLs after a database authorization check.
- `status_history`, `review_actions`, and `activity_log` are append-only.
- The browser receives the public Supabase anonymous key only. A service-role key is neither required nor exposed.
