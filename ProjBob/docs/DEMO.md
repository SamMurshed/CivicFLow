# Recruiter Demo Script (3–5 minutes)

1. **Purpose (20 seconds):** Explain that CivicFlow models a fictional public-sector procurement workflow and uses synthetic data only.
2. **Agency submission (60 seconds):** Sign in as an agency user, create a draft, choose a category, show the generated requirements, attach documents, and submit. Point out that incomplete submissions are blocked.
3. **Analyst review (90 seconds):** Open the queue, filter it, claim the request with **Start Review**, open a private document, accept or reject it, update checklist items, and request a correction. Show the timestamped history.
4. **Correction cycle (45 seconds):** Return as the agency user, review the notification and analyst note, upload a replacement, and resubmit. Explain the distinct `correction_submitted` state.
5. **Decision and reporting (60 seconds):** Resume review, satisfy required items, approve with a rationale, then open Reporting to show outcome metrics, monthly volume, overdue work, and safe CSV export.
6. **Engineering close (30 seconds):** Show the RLS migrations, private-storage policy, Vitest/Playwright coverage, and GitHub Actions workflow. State the limitations honestly: synthetic data, free-tier deployment, and no production-government claims.
