-- supabase/admin.sql  (run in Supabase: SQL Editor → New query → paste → Run. Re-run after every change.)
--
-- One function that returns every dashboard number as JSON in a single call.
-- Only the server (service-role key) may run it: the app's public key cannot.
-- Needs supabase/002_invites_progress.sql to have been run first.

create or replace function public.admin_stats()
returns json
language sql
stable
set search_path = public
as $$
with
p as (
  select id, age, position, lang, country, invite_code, created_at,
         (created_at at time zone 'Asia/Tbilisi')::date as signup_day
  from public.players
),
per_player as (
  select p.id, p.invite_code, count(distinct c.challenge_slug) as done
  from p
  left join public.challenge_completions c on c.player_id = p.id
  group by p.id, p.invite_code
),
act as (
  select d.player_id, d.day, p.signup_day, p.invite_code
  from public.player_days d
  join p on p.id = d.player_id
),
active_days as (
  select player_id, count(*) as n_days, max(day) as last_day,
         bool_or(day >= signup_day + 1) as came_back,
         bool_or(day >= signup_day + 7) as came_back_week
  from act
  group by player_id
),
today as (
  select (now() at time zone 'Asia/Tbilisi')::date as d
),
days as (
  select generate_series((select d from today) - 29, (select d from today), interval '1 day')::date as day
),
signups as (
  select signup_day as day, count(*) as n from p group by 1
),
daily_active as (
  select day, count(distinct player_id) as n from act group by 1
),
tries as (
  select lesson_id,
         count(*)                                   as checks,
         count(*) filter (where result = 'wrong')   as wrong,
         count(distinct player_id)                  as players
  from public.lesson_attempts
  group by lesson_id
),
fails as (
  select lesson_id, fail_key, count(*) as n,
         row_number() over (partition by lesson_id order by count(*) desc) as rk
  from public.lesson_attempts
  where result = 'wrong' and fail_key is not null
  group by lesson_id, fail_key
),
inv as (
  select coalesce(pp.invite_code, '') as code,
         count(*)                                                      as players,
         count(*) filter (where p.created_at >= now() - interval '7 days') as new_7d,
         count(*) filter (where ad.last_day >= (select d from today) - 6) as active_7d,
         count(*) filter (where ad.came_back)                          as came_back,
         count(*) filter (where pp.done >= 1)                          as played,
         count(*) filter (where pp.done >= 10)                         as done_10,
         round(avg(pp.done), 1)                                        as avg_done
  from per_player pp
  join p on p.id = pp.id
  left join active_days ad on ad.player_id = pp.id
  group by 1
)
select json_build_object(
  'generated_at',    now(),
  'players_total',   (select count(*) from p),
  'players_7d',      (select count(*) from p where created_at >= now() - interval '7 days'),
  'players_prev_7d', (select count(*) from p where created_at >= now() - interval '14 days'
                                              and created_at <  now() - interval '7 days'),
  'active_7d',       (select count(*) from active_days where last_day >= (select d from today) - 6),
  'retention', json_build_object(
    -- of players who signed up at least 1 / 7 days ago: how many opened the app again later
    'eligible_1d',   (select count(*) from p where signup_day <= (select d from today) - 1),
    'came_back_1d',  (select count(*) from p join active_days a on a.player_id = p.id
                      where p.signup_day <= (select d from today) - 1 and a.came_back),
    'eligible_7d',   (select count(*) from p where signup_day <= (select d from today) - 7),
    'came_back_7d',  (select count(*) from p join active_days a on a.player_id = p.id
                      where p.signup_day <= (select d from today) - 7 and a.came_back_week)
  ),
  'done_hist', coalesce(
    (select json_object_agg(done, n) from (select done, count(*) as n from per_player group by 1) s),
    '{}'::json),
  'completions_total', (select count(*) from public.challenge_completions),
  'checks_total',      (select count(*) from public.lesson_attempts),
  'rated',             (select count(*) from public.feedback),
  'per_challenge', coalesce(
    (select json_object_agg(challenge_slug, n)
       from (select challenge_slug, count(*) as n from public.challenge_completions group by 1) s),
    '{}'::json),
  'lesson_tries', coalesce(
    (select json_object_agg(t.lesson_id, json_build_object(
              'checks', t.checks, 'wrong', t.wrong, 'players', t.players,
              'top_fail', (select f.fail_key from fails f where f.lesson_id = t.lesson_id and f.rk = 1)))
       from tries t),
    '{}'::json),
  'ages', coalesce(
    (select json_object_agg(age, n) from (select age, count(*) as n from p group by 1) s), '{}'::json),
  'positions', coalesce(
    (select json_object_agg(position, n) from (select position, count(*) as n from p group by 1) s), '{}'::json),
  'langs', coalesce(
    (select json_object_agg(coalesce(lang, '?'), n) from (select lang, count(*) as n from p group by 1) s), '{}'::json),
  'countries', coalesce(
    (select json_object_agg(coalesce(country, '?'), n) from (select country, count(*) as n from p group by 1) s), '{}'::json),
  'ratings', coalesce(
    (select json_object_agg(rating, n) from (select rating, count(*) as n from public.feedback group by 1) s), '{}'::json),
  'daily', (
    select json_agg(json_build_object('day', d.day, 'signups', coalesce(s.n, 0), 'active', coalesce(a.n, 0)) order by d.day)
    from days d
    left join signups s on s.day = d.day
    left join daily_active a on a.day = d.day
  ),
  'invites', coalesce((
    select json_agg(json_build_object(
             'code', i.code, 'label', i.label, 'kind', i.kind, 'default_lang', i.default_lang,
             'archived', i.archived, 'created_at', i.created_at,
             'players', coalesce(s.players, 0), 'new_7d', coalesce(s.new_7d, 0),
             'active_7d', coalesce(s.active_7d, 0), 'came_back', coalesce(s.came_back, 0),
             'played', coalesce(s.played, 0), 'done_10', coalesce(s.done_10, 0), 'avg_done', coalesce(s.avg_done, 0))
           order by i.archived, coalesce(s.players, 0) desc, i.created_at desc)
    from public.invites i
    left join inv s on s.code = i.code
  ), '[]'::json),
  -- players whose code is not in the invites table ('' = came without any link)
  'other_sources', coalesce((
    select json_agg(json_build_object(
             'code', s.code, 'players', s.players, 'new_7d', s.new_7d, 'active_7d', s.active_7d,
             'came_back', s.came_back, 'played', s.played, 'done_10', s.done_10, 'avg_done', s.avg_done)
           order by s.players desc)
    from inv s
    where not exists (select 1 from public.invites i where i.code = s.code)
  ), '[]'::json)
);
$$;

-- Lock it down: nobody but the server can call it.
revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;
