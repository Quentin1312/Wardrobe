-- Wardrobe metadata and laundry state for existing projects.
alter table public.clothes
  add column if not exists name text,
  add column if not exists favorite boolean not null default false,
  add column if not exists dirty boolean not null default false,
  add column if not exists photo_clean_url text;

-- Keep owner updates explicit: the caller must own the existing row and the
-- resulting row. This also prevents changing user_id through the Data API.
drop policy if exists "clothes_all_own" on public.clothes;
create policy "clothes_all_own" on public.clothes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "outfits_all_own" on public.outfits;
create policy "outfits_all_own" on public.outfits
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "tryon_results_all_own" on public.tryon_results;
create policy "tryon_results_all_own" on public.tryon_results
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
