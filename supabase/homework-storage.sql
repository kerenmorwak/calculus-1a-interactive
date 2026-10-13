-- Private storage for homework submissions.
-- Run once in the Supabase SQL editor. Safe to run again.
-- It does not change any existing table; public.homework_submissions already
-- exists in schema.sql (one row per uploaded file, insert/select own rows only).

-- 1. A private bucket: no public URLs, PDFs and images only, 20 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework-submissions',
  'homework-submissions',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2. Each signed-in user may upload into, and read from, their own folder only:
--    homework-submissions/{auth.uid()}/...
-- There is no update or delete policy: a replacement is uploaded as a new
-- submission, and earlier files stay in place.
drop policy if exists "homework: users upload to own folder" on storage.objects;
create policy "homework: users upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'homework-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "homework: users read own files" on storage.objects;
create policy "homework: users read own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'homework-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);
