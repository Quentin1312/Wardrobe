-- AI try-on results contain personal photos and must not be public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tryon',
  'tryon',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tryon_select_own" on storage.objects;
create policy "tryon_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tryon'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "tryon_insert_own" on storage.objects;
create policy "tryon_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tryon'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "tryon_delete_own" on storage.objects;
create policy "tryon_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tryon'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Public-schema tables are no longer guaranteed to be exposed automatically.
grant select, insert on table public.tryon_results to authenticated;
