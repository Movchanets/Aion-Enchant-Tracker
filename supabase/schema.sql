-- Aion Enchant Tracker schema
-- Run this in Supabase SQL Editor

begin;

-- ----------
-- Tables
-- ----------

create table if not exists public.feathers_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  discord_name text,
  target_level integer not null check (target_level >= 1),
  is_success boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.accessories_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  discord_name text,
  target_level integer not null check (target_level >= 1),
  is_success boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gear_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  discord_name text,
  item_level integer not null check (item_level >= 1),
  target_level integer not null check (target_level >= 1),
  is_success boolean not null,
  item_grade text not null,
  stone_level text not null,
  supplement text not null default 'none' check (supplement in ('none', 'lesser', 'regular', 'greater')),
  created_at timestamptz not null default now()
);

alter table public.gear_attempts
  add column if not exists item_level integer not null default 1;

alter table public.gear_attempts
  alter column item_level drop default;

alter table public.feathers_attempts
  add column if not exists nickname text;

alter table public.accessories_attempts
  add column if not exists nickname text;

alter table public.gear_attempts
  add column if not exists nickname text;

alter table public.feathers_attempts
  add column if not exists discord_name text;

alter table public.accessories_attempts
  add column if not exists discord_name text;

alter table public.gear_attempts
  add column if not exists discord_name text;

alter table public.gear_attempts
  add column if not exists supplement text not null default 'none'
  check (supplement in ('none', 'lesser', 'regular', 'greater'));

update public.feathers_attempts
set nickname = coalesce(nickname, discord_name)
where nickname is null;

update public.accessories_attempts
set nickname = coalesce(nickname, discord_name)
where nickname is null;

update public.gear_attempts
set nickname = coalesce(nickname, discord_name)
where nickname is null;

create index if not exists idx_feathers_attempts_target_level
  on public.feathers_attempts(target_level);

create index if not exists idx_feathers_attempts_nickname
  on public.feathers_attempts(nickname);

create index if not exists idx_feathers_attempts_user_nickname
  on public.feathers_attempts(user_id, nickname);

create index if not exists idx_accessories_attempts_target_level
  on public.accessories_attempts(target_level);

create index if not exists idx_accessories_attempts_nickname
  on public.accessories_attempts(nickname);

create index if not exists idx_accessories_attempts_user_nickname
  on public.accessories_attempts(user_id, nickname);

drop index if exists public.idx_gear_attempts_grouping;

create index if not exists idx_gear_attempts_grouping
  on public.gear_attempts(item_level, item_grade, stone_level, supplement, target_level);

create index if not exists idx_gear_attempts_nickname
  on public.gear_attempts(nickname);

create index if not exists idx_gear_attempts_user_nickname
  on public.gear_attempts(user_id, nickname);

-- ----------
-- RLS
-- ----------

alter table public.feathers_attempts enable row level security;
alter table public.accessories_attempts enable row level security;
alter table public.gear_attempts enable row level security;

-- Feathers

drop policy if exists "feathers_select_all" on public.feathers_attempts;
create policy "feathers_select_all"
  on public.feathers_attempts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "feathers_insert_own" on public.feathers_attempts;
create policy "feathers_insert_own"
  on public.feathers_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Accessories

drop policy if exists "accessories_select_all" on public.accessories_attempts;
create policy "accessories_select_all"
  on public.accessories_attempts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "accessories_insert_own" on public.accessories_attempts;
create policy "accessories_insert_own"
  on public.accessories_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Gear

drop policy if exists "gear_select_all" on public.gear_attempts;
create policy "gear_select_all"
  on public.gear_attempts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "gear_insert_own" on public.gear_attempts;
create policy "gear_insert_own"
  on public.gear_attempts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ----------
-- Read-only grants for anon/authenticated
-- ----------

grant select on public.feathers_attempts to anon, authenticated;
grant select on public.accessories_attempts to anon, authenticated;
grant select on public.gear_attempts to anon, authenticated;

grant insert on public.feathers_attempts to authenticated;
grant insert on public.accessories_attempts to authenticated;
grant insert on public.gear_attempts to authenticated;

-- ----------
-- Aggregated views
-- ----------

create or replace view public.global_feathers_stats as
select
  target_level,
  count(*)::bigint as total_attempts,
  count(*) filter (where is_success)::bigint as successful_attempts,
  round(
    (count(*) filter (where is_success)::numeric / nullif(count(*), 0)::numeric) * 100,
    2
  ) as success_rate
from public.feathers_attempts
group by target_level
order by target_level;

create or replace view public.global_accessories_stats as
select
  target_level,
  count(*)::bigint as total_attempts,
  count(*) filter (where is_success)::bigint as successful_attempts,
  round(
    (count(*) filter (where is_success)::numeric / nullif(count(*), 0)::numeric) * 100,
    2
  ) as success_rate
from public.accessories_attempts
group by target_level
order by target_level;

create or replace view public.global_gear_stats as
select
  item_level,
  item_grade,
  stone_level,
  supplement,
  target_level,
  count(*)::bigint as total_attempts,
  count(*) filter (where is_success)::bigint as successful_attempts,
  round(
    (count(*) filter (where is_success)::numeric / nullif(count(*), 0)::numeric) * 100,
    2
  ) as success_rate
from public.gear_attempts
group by item_level, item_grade, stone_level, supplement, target_level
order by item_level, item_grade, stone_level, supplement, target_level;

grant select on public.global_feathers_stats to anon, authenticated;
grant select on public.global_accessories_stats to anon, authenticated;
grant select on public.global_gear_stats to anon, authenticated;

commit;
