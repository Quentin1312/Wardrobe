-- ============================================================
-- Wardrobe — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI).
-- ============================================================

-- ---------- Enums ----------
do $$ begin
  create type clothing_category as enum ('top', 'bottom', 'shoes', 'jacket', 'accessory');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
-- One row per auth user. id = auth.users.id.
create table if not exists public.profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  email                     text,
  first_name                text,
  profile_photo_url         text,
  profile_photo_clean_url   text,             -- after SAM background removal
  location_city             text,
  onboarded                 boolean not null default false,
  created_at                timestamptz not null default now()
);

-- ---------- clothes ----------
create table if not exists public.clothes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  photo_url        text not null,
  photo_clean_url  text,                       -- after SAM background removal
  category         clothing_category,
  dominant_color   text,                       -- hex, e.g. #1c1917
  style_tags       text[] default '{}',
  created_at       timestamptz not null default now()
);
create index if not exists clothes_user_id_idx on public.clothes(user_id);

-- ---------- outfits ----------
create table if not exists public.outfits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  clothes_ids      uuid[] not null default '{}',
  weather_context  text,                       -- temp + condition at generation time
  liked            boolean,                    -- true / false / null (unrated)
  generated_at     timestamptz not null default now()
);
create index if not exists outfits_user_id_idx on public.outfits(user_id);

-- ---------- tryon_results ----------
create table if not exists public.tryon_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  outfit_id         uuid not null references public.outfits(id) on delete cascade,
  result_image_url  text not null,
  generated_at      timestamptz not null default now()
);
create index if not exists tryon_results_user_id_idx on public.tryon_results(user_id);

-- ============================================================
-- Row Level Security — every user only sees their own rows
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.clothes       enable row level security;
alter table public.outfits       enable row level security;
alter table public.tryon_results enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- generic owner policies for the rest
do $$
declare t text;
begin
  foreach t in array array['clothes', 'outfits', 'tryon_results'] loop
    execute format('drop policy if exists "%1$s_all_own" on public.%1$s', t);
    execute format(
      'create policy "%1$s_all_own" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true), ('clothes', 'clothes', true)
on conflict (id) do nothing;

-- Storage policies: users read/write only within their own <user_id>/ folder.
do $$
declare b text;
begin
  foreach b in array array['profiles', 'clothes'] loop
    execute format('drop policy if exists "%1$s_read" on storage.objects', b);
    execute format(
      'create policy "%1$s_read" on storage.objects
         for select using (bucket_id = %1$L)', b);

    execute format('drop policy if exists "%1$s_write" on storage.objects', b);
    execute format(
      'create policy "%1$s_write" on storage.objects
         for insert with check (
           bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text)', b);

    execute format('drop policy if exists "%1$s_update" on storage.objects', b);
    execute format(
      'create policy "%1$s_update" on storage.objects
         for update using (
           bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text)', b);

    execute format('drop policy if exists "%1$s_delete" on storage.objects', b);
    execute format(
      'create policy "%1$s_delete" on storage.objects
         for delete using (
           bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text)', b);
  end loop;
end $$;
