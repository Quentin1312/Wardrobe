-- Trigger-only function: nobody should call it through the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Public assets remain addressable by their URL, but authenticated users can
-- only list objects inside their own folder.
drop policy if exists "profiles_read" on storage.objects;
create policy "profiles_read" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profiles'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "clothes_read" on storage.objects;
create policy "clothes_read" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'clothes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
