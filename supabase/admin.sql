-- supabase/admin.sql  (NEW FILE — run once in Supabase: SQL Editor → New query → paste → Run)
--
-- One function that returns every dashboard number as JSON in a single call.
-- Only the server (service-role key) may run it: the app's public key cannot.

create or replace function public.admin_stats()
returns json
language sql
stable
set search_path = public
as $$
with
p as (
  select id, age, position, created_at from public.players
),
per_player as (
  select p.id, count(distinct c.challenge_slug) as done
  from p
  left join public.challenge_completions c on c.player_id = p.id
  group by p.id
),
days as (
  -- last 30 days, Georgian time, including days with zero signups
  select generate_series(
           (now() at time zone 'Asia/Tbilisi')::date - 29,
           (now() at time zone 'Asia/Tbilisi')::date,
           interval '1 day'
         )::date as day
),
signups as (
  select (created_at at time zone 'Asia/Tbilisi')::date as day, count(*) as n
  from p
  group by 1
)
select json_build_object(
  'generated_at',    now(),
  'players_total',   (select count(*) from p),
  'players_7d',      (select count(*) from p where created_at >= now() - interval '7 days'),
  'players_prev_7d', (select count(*) from p where created_at >= now() - interval '14 days'
                                              and created_at <  now() - interval '7 days'),
  'funnel', json_build_object(
    'signed_up', (select count(*) from per_player),
    'done_1',    (select count(*) from per_player where done >= 1),
    'done_2',    (select count(*) from per_player where done >= 2),
    'done_3',    (select count(*) from per_player where done >= 3),
    'done_4',    (select count(*) from per_player where done >= 4),
    'done_5',    (select count(*) from per_player where done >= 5),
    'rated',     (select count(*) from public.feedback)
  ),
  'per_challenge', coalesce(
    (select json_object_agg(challenge_slug, n)
       from (select challenge_slug, count(*) as n from public.challenge_completions group by 1) s),
    '{}'::json),
  'ages', coalesce(
    (select json_object_agg(age, n) from (select age, count(*) as n from p group by 1) s),
    '{}'::json),
  'positions', coalesce(
    (select json_object_agg(position, n) from (select position, count(*) as n from p group by 1) s),
    '{}'::json),
  'ratings', coalesce(
    (select json_object_agg(rating, n) from (select rating, count(*) as n from public.feedback group by 1) s),
    '{}'::json),
  'signups_daily', (
    select json_agg(json_build_object('day', d.day, 'n', coalesce(s.n, 0)) order by d.day)
    from days d
    left join signups s on s.day = d.day
  ),
  'players_before_window', (
    select count(*) from p
    where (created_at at time zone 'Asia/Tbilisi')::date < (select min(day) from days)
  )
);
$$;

-- Lock it down: nobody but the server can call it.
revoke all on function public.admin_stats() from public, anon, authenticated;
grant execute on function public.admin_stats() to service_role;