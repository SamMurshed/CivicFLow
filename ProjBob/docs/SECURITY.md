# Security Model

## Controls implemented

- Authentication through Supabase Auth with role data stored in `public.profiles`.
- Role checks in protected layouts, Server Actions, and export/download Route Handlers.
- Row Level Security on every application table.
- Private storage with request-scoped upload and read policies.
- Zod validation for request, review, checklist, document, comment, and feedback mutations.
- Server-validated status transitions and required-checklist approval gates.
- Append-only status, review, and activity history.
- Formula-injection protection for CSV exports.
- File type and 10 MB size limits in both application code and storage configuration.
- Short feedback/comment cooldowns to reduce accidental duplicate submissions.
- Security response headers and no exposed service-role credential.

## Demonstration limitations

- This is a portfolio system using synthetic data, not a production procurement platform.
- It has no malware scanning, enterprise identity provider, centralized monitoring, backup automation, or formal compliance certification.
- Application cooldowns are lightweight abuse controls, not distributed rate limiting.
- Authenticated end-to-end tests require a configured Supabase test project and demo credentials.

Report repository security concerns privately to the repository owner. Do not put credentials or sensitive data in an issue.
