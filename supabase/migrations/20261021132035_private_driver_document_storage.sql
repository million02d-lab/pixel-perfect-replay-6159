insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'driver-documents',
  'driver-documents',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp'];

create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.driver_profiles(user_id) on delete cascade,
  doc_type text not null check (doc_type in ('identity','driving_license','vehicle_registration','insurance')),
  storage_path text not null unique,
  original_filename text not null check (char_length(trim(original_filename)) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  file_size_bytes integer not null check (file_size_bytes between 1 and 10485760),
  review_status public.review_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists driver_documents_driver_created_idx on public.driver_documents(driver_id, created_at desc);
create index if not exists driver_documents_review_type_idx on public.driver_documents(review_status, doc_type);

alter table public.driver_documents enable row level security;
create policy "Drivers read own documents" on public.driver_documents for select to authenticated using ((select auth.uid()) = driver_id);
create policy "Drivers submit own document metadata" on public.driver_documents for insert to authenticated with check (
  (select auth.uid()) = driver_id
  and storage_path like ((select auth.uid())::text || '/%')
  and exists (select 1 from public.driver_profiles d where d.user_id = (select auth.uid()))
);
revoke all on public.driver_documents from anon, authenticated;
grant select on public.driver_documents to authenticated;
grant insert (driver_id, doc_type, storage_path, original_filename, mime_type, file_size_bytes) on public.driver_documents to authenticated;

drop policy if exists "Driver docs upload own pending" on storage.objects;
drop policy if exists "Driver docs read own" on storage.objects;
create policy "Driver docs upload own pending" on storage.objects for insert to authenticated with check (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.driver_profiles d where d.user_id = (select auth.uid()) and d.verification_status = 'pending')
);
create policy "Driver docs read own" on storage.objects for select to authenticated using (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
