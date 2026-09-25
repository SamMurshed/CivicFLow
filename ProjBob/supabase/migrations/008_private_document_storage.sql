-- Private storage bucket for procurement request documents.
-- Object paths must be: <request_uuid>/<randomized-file-name>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-documents',
  'request-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "request documents: visible request participants read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-documents'
    and exists (
      select 1
      from public.procurement_requests pr
      where pr.id::text = (storage.foldername(name))[1]
    )
  );

create policy "request documents: applicants upload to editable requests"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'request-documents'
    and exists (
      select 1
      from public.procurement_requests pr
      where pr.id::text = (storage.foldername(name))[1]
        and (
          (public.current_role_name() = 'agency_user'
            and pr.agency_org_id = public.current_org_id()
            and pr.status in ('draft', 'awaiting_correction'))
          or
          (public.current_role_name() = 'vendor'
            and pr.vendor_org_id = public.current_org_id()
            and pr.status = 'awaiting_correction')
        )
    )
  );

create policy "request documents: uploader removes unsubmitted files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'request-documents'
    and owner_id = auth.uid()::text
    and exists (
      select 1
      from public.procurement_requests pr
      where pr.id::text = (storage.foldername(name))[1]
        and pr.status in ('draft', 'awaiting_correction')
    )
  );
