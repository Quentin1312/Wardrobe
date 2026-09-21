alter table public.outfits
  add column if not exists planned_for date,
  add column if not exists plan_scope text not null default 'day',
  add column if not exists rationale text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'outfits_plan_scope_check'
      and conrelid = 'public.outfits'::regclass
  ) then
    alter table public.outfits
      add constraint outfits_plan_scope_check
      check (plan_scope in ('day', 'week'));
  end if;
end $$;

create index if not exists outfits_week_plan_idx
  on public.outfits(user_id, planned_for, generated_at desc)
  where plan_scope = 'week' and planned_for is not null;
