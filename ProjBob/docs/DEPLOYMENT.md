# Free-Tier Deployment

The intended demonstration deployment uses **Supabase Free** and **Vercel Hobby**. The repository does not claim to be a production government system.

## 1. Provision Supabase

1. Create a Supabase project.
2. Apply `supabase/migrations/001_extensions_and_enums.sql` through `008_private_document_storage.sql` in order, or link the Supabase CLI and run `npx supabase db push`.
3. Load `supabase/seed/seed.sql` for fictional demonstration content.
4. Create test users in Supabase Authentication and ensure each `public.profiles.id` matches its Auth user UUID. For a hosted project, adapt the profile seed UUIDs to the UUIDs created by Supabase Auth.
5. Confirm that the `request-documents` bucket is private and that the storage policies from migration 008 exist.

## 2. Configure Vercel

1. Import the GitHub repository.
2. Set **Root Directory** to `ProjBob`.
3. Use the Next.js framework preset.
4. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL`.
5. Deploy, then add the Vercel domain to Supabase Authentication redirect URLs.

## 3. Verify

Run the GitHub Actions workflow and manually verify:

- Landing and sign-in pages load over HTTPS.
- Each demo role reaches only its permitted routes.
- Agency upload, submit, analyst review, correction, resubmission, and decision work.
- Document links expire and unauthorized accounts receive no file.
- Reporting filters and CSV exports contain only rows visible to the signed-in role.

## Rollback

- Vercel: promote the previous successful deployment.
- Database: create a forward migration that reverses the faulty schema change; do not edit already-applied production migrations.
- Files: keep the bucket private and remove only confirmed orphaned demonstration objects.
