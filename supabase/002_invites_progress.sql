-- supabase/002_invites_progress.sql  (run ONCE in Supabase: SQL Editor → New query → paste → Run)
--
-- Adds: invite links, player language / country / invite, XP and attempts per lesson,
-- every Check press (lesson_attempts) and one row per active day (player_days).
-- Safe to run on the live database (and safe to run twice): it only adds columns and tables.
-- Afterwards also run supabase/admin.sql again (the dashboard function changed).

-- 1. Players: where they came from, which language, which country --------------------------
alter table public.players add column if not exists invite_code text;
alter table public.players add column if not exists lang        text check (lang in ('ka', 'en', 'ru'));
alter table public.players add column if not exists country     text check (country ~ '^[A-Z]{2}$');
create index if not exists players_invite_code_idx on public.players (invite_code);

-- 2. Invite links (created in /admin; only the server can read or write them) ----------------
create table if not exists public.invites (
  code          text primary key check (code ~ '^[a-z0-9-]{2,40}$'),
  label         text not null,
  kind          text not null default 'other' check (kind in ('team', 'social', 'partner', 'other')),
  default_lang  text check (default_lang in ('ka', 'en', 'ru')),
  archived      boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.invites enable row level security;  -- no policies: the app key cannot touch it

-- Built-in source for the "Share with friends" button.
insert into public.invites (code, label, kind) values ('share', 'Shared by players (in-app button)', 'social')
on conflict (code) do nothing;

-- 3. First completion of a lesson: how it went --------------------------------------------
alter table public.challenge_completions add column if not exists xp          integer;
alter table public.challenge_completions add column if not exists attempts    integer;
alter table public.challenge_completions add column if not exists ms_total    integer;
alter table public.challenge_completions add column if not exists hint_levels integer;

-- 4. Every Check press ----------------------------------------------------------------------
create table if not exists public.lesson_attempts (
  id          bigint generated always as identity primary key,
  player_id   uuid not null references public.players (id) on delete cascade,
  lesson_id   text not null,
  attempt     integer not null,
  result      text not null check (result in ('correct', 'almost', 'wrong')),
  fail_key    text,
  ms_on_task  integer,
  stage       integer not null default 1,
  timed_out   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists lesson_attempts_lesson_idx on public.lesson_attempts (lesson_id);
alter table public.lesson_attempts enable row level security;
drop policy if exists "attempts: insert own" on public.lesson_attempts;
create policy "attempts: insert own" on public.lesson_attempts for insert to authenticated with check (auth.uid() = player_id);

-- 5. Active days (one row per player per day the app was opened) -----------------------------
create table if not exists public.player_days (
  player_id  uuid not null references public.players (id) on delete cascade,
  day        date not null,
  primary key (player_id, day)
);
alter table public.player_days enable row level security;
drop policy if exists "days: insert own" on public.player_days;
create policy "days: insert own" on public.player_days for insert to authenticated with check (auth.uid() = player_id);
drop policy if exists "days: read own" on public.player_days;
create policy "days: read own"   on public.player_days for select to authenticated using (auth.uid() = player_id);

-- Players who signed up before this file get their first active day from their signup date.
insert into public.player_days (player_id, day)
select id, (created_at at time zone 'Asia/Tbilisi')::date from public.players
on conflict do nothing;
insert into public.player_days (player_id, day)
select distinct player_id, (completed_at at time zone 'Asia/Tbilisi')::date from public.challenge_completions
on conflict do nothing;
