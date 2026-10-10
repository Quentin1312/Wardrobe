-- A worn look the user actually loved: stronger signal than "worn once".
alter table public.outfits add column if not exists favorite boolean not null default false;

-- The history screen reads a month of worn looks at a time.
create index if not exists outfits_user_worn_idx on public.outfits (user_id, generated_at desc) where liked;
