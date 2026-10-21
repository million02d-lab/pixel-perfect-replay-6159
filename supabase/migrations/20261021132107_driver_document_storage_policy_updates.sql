drop policy if exists "Driver docs upload own pending" on storage.objects;
create policy "Driver docs upload own active" on storage.objects for insert to authenticated with check (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.driver_profiles d
    where d.user_id = (select auth.uid())
      and d.verification_status in ('pending','approved')
  )
);

drop policy if exists "Driver docs delete orphan own" on storage.objects;
create policy "Driver docs delete orphan own" on storage.objects for delete to authenticated using (
  bucket_id = 'driver-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (
    select 1 from public.driver_documents d
    where d.storage_path = storage.objects.name
  )
);
