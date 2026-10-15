-- supabase/schema.sql  (NEW FILE — run once in Supabase: SQL Editor → New query → paste → Run)
--
-- Players sign in anonymously (no email / password). Row Level Security lets each
-- player write only their own rows. Nobody can read other players' data with the anon key;
-- you read everything from the dashboard (Table Editor) or with the service-role key on a server.

-- 1. Players: one row per device/auth user ---------------------------------------------------
create table if not exists public.players (
  id          uuid primary key references auth.users (id) on delete cascade,
  position    text not null check (position in ('GK', 'DEF', 'MID', 'ATT')),
  age         smallint not null check (age between 6 and 18),
  created_at  timestamptz not null default now()
);

-- 2. Challenge completions: first win per challenge (replays don't add rows) -----------------
create table if not exists public.challenge_completions (
  id              bigint generated always as identity primary key,
  player_id       uuid not null references public.players (id) on delete cascade,
  challenge_slug  text not null,
  completed_at    timestamptz not null default now(),
  unique (player_id, challenge_slug)
);

-- 3. Feedback: "როგორი იყო?" after all five challenges (one answer per player; changing it updates) -
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  player_id   uuid not null unique references public.players (id) on delete cascade,
  rating      text not null check (rating in ('fire', 'great', 'ok')),
  created_at  timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------------------------------
alter table public.players               enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.feedback              enable row level security;

create policy "players: insert own"  on public.players for insert to authenticated with check (auth.uid() = id);
create policy "players: read own"    on public.players for select to authenticated using (auth.uid() = id);
create policy "players: update own"  on public.players for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "completions: insert own" on public.challenge_completions for insert to authenticated with check (auth.uid() = player_id);
create policy "completions: read own"   on public.challenge_completions for select to authenticated using (auth.uid() = player_id);

create policy "feedback: insert own" on public.feedback for insert to authenticated with check (auth.uid() = player_id);
create policy "feedback: read own"   on public.feedback for select to authenticated using (auth.uid() = player_id);
create policy "feedback: update own" on public.feedback for update to authenticated using (auth.uid() = player_id) with check (auth.uid() = player_id);

-- Handy view for you (dashboard / SQL editor only; not exposed to the app) ----------------------
create or replace view public.challenge_funnel
with (security_invoker = true) as
select c.challenge_slug,
       count(*)                                  as completions,
       round(avg(p.age), 1)                      as avg_age,
       count(*) filter (where p.position = 'GK')  as gk,
       count(*) filter (where p.position = 'DEF') as def,
       count(*) filter (where p.position = 'MID') as mid,
       count(*) filter (where p.position = 'ATT') as att
from public.challenge_completions c
join public.players p on p.id = c.player_id
group by c.challenge_slug
order by completions desc;
