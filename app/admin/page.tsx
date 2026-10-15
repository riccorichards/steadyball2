// app/admin/page.tsx  (NEW FILE)
//
// Investor / admin dashboard. Totals only — no individual player rows are ever shown.
// Data: one call to the admin_stats() SQL function (supabase/admin.sql) with the service-role key.

import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CHALLENGES } from "@/lib/challenges";
import {
  BarList,
  Card,
  ColumnChart,
  StatTile,
} from "@/components/admin/charts";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

interface Stats {
  generated_at: string;
  players_total: number;
  players_7d: number;
  players_prev_7d: number;
  players_before_window: number;
  funnel: {
    signed_up: number;
    done_1: number;
    done_2: number;
    done_3: number;
    done_4: number;
    done_5: number;
    rated: number;
  };
  per_challenge: Record<string, number>;
  ages: Record<string, number>;
  positions: Record<string, number>;
  ratings: Record<string, number>;
  signups_daily: { day: string; n: number }[];
}

const POSITION_LABELS: { value: string; en: string; ka: string }[] = [
  { value: "GK", en: "Goalkeeper", ka: "მეკარე" },
  { value: "DEF", en: "Defender", ka: "მცველი" },
  { value: "MID", en: "Midfielder", ka: "ნახევარმცველი" },
  { value: "ATT", en: "Forward", ka: "თავდამსხმელი" },
];
const RATING_LABELS: { value: string; icon: string; ka: string }[] = [
  { value: "fire", icon: "🔥", ka: "ცეცხლია" },
  { value: "great", icon: "⚽", ka: "მაგარია" },
  { value: "ok", icon: "😐", ka: "ნორმალური" },
];
const AGE_RANGE = [8, 9, 10, 11, 12, 13, 14, 15, 16];

const pct = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";

const growth = (now: number, prev: number): string => {
  if (prev === 0) return now > 0 ? "new this week" : "no signups yet";
  const change = Math.round(((now - prev) / prev) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs previous week`;
};

const dayLabel = (iso: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

async function loadStats(): Promise<{
  stats: Stats | null;
  error: string | null;
}> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("admin_stats");
    if (error) throw new Error(error.message);
    return { stats: data as Stats, error: null };
  } catch (e) {
    return { stats: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function AdminPage(): Promise<React.JSX.Element> {
  if (!(await isAdmin())) redirect("/admin/login");
  const { stats, error } = await loadStats();

  const updated = stats
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tbilisi",
      }).format(new Date(stats.generated_at))
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            SteadyBall · Dashboard
          </h1>
          {updated && (
            <p className="mt-0.5 text-xs text-slate-500">
              Updated {updated} (Tbilisi time)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </header>

      {error && (
        <div className="mt-8 rounded-3xl border border-rose-400/30 bg-rose-950/40 p-5 text-sm">
          <p className="font-bold text-rose-200">Couldn’t load the numbers.</p>
          <p className="mt-1 text-rose-100/80">{error}</p>
          <p className="mt-3 text-slate-400">
            Check that <code>supabase/admin.sql</code> was run in Supabase and
            that <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in{" "}
            <code>.env.local</code>.
          </p>
        </div>
      )}

      {stats && <Dashboard s={stats} />}
    </div>
  );
}

function Dashboard({ s }: { s: Stats }): React.JSX.Element {
  const f = s.funnel;
  const loved = (s.ratings.fire ?? 0) + (s.ratings.great ?? 0);
  const last30 = s.signups_daily.reduce((sum, d) => sum + d.n, 0);

  if (s.players_total === 0) {
    return (
      <p className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
        No players yet. Numbers appear here as soon as the first player signs
        up.
      </p>
    );
  }

  const funnelSteps = [
    { key: "signed_up", label: "Signed up", value: f.signed_up },
    { key: "done_1", label: "Finished 1 challenge", value: f.done_1 },
    { key: "done_2", label: "Finished 2", value: f.done_2 },
    { key: "done_3", label: "Finished 3", value: f.done_3 },
    { key: "done_4", label: "Finished 4", value: f.done_4 },
    { key: "done_5", label: "Finished all 5", value: f.done_5 },
    { key: "rated", label: "Rated the app", value: f.rated },
  ];

  return (
    <div className="mt-6 space-y-4">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Players"
          value={`${s.players_total}`}
          sub={`+${s.players_7d} this week · ${growth(s.players_7d, s.players_prev_7d)}`}
        />
        <StatTile
          label="Played a challenge"
          value={pct(f.done_1, f.signed_up)}
          sub={`${f.done_1} of ${f.signed_up} players finished at least 1`}
        />
        <StatTile
          label="Finished all 5"
          value={pct(f.done_5, f.signed_up)}
          sub={`${f.done_5} players`}
        />
        <StatTile
          label="Loved it (🔥 + ⚽)"
          value={pct(loved, f.rated)}
          sub={`${f.rated} rating${f.rated === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Funnel */}
        <Card
          title="Funnel"
          subtitle="How far players get · % of everyone who signed up"
        >
          <BarList
            max={f.signed_up}
            rows={funnelSteps.map((step) => ({
              key: step.key,
              label: step.label,
              value: step.value,
              display: `${step.value} · ${pct(step.value, f.signed_up)}`,
              title: `${step.label}: ${step.value} players (${pct(step.value, f.signed_up)})`,
            }))}
          />
        </Card>

        {/* Signups over time */}
        <Card
          title="Signups, last 30 days"
          subtitle={`${last30} new players in 30 days · ${s.players_total} in total`}
        >
          <ColumnChart
            labelEvery={7}
            columns={s.signups_daily.map((d) => ({
              key: d.day,
              label: dayLabel(d.day),
              value: d.n,
              title: `${dayLabel(d.day)}: ${d.n} signup${d.n === 1 ? "" : "s"}`,
            }))}
          />
        </Card>

        {/* Per challenge */}
        <Card
          title="Completions per challenge"
          subtitle="Players who solved each challenge"
        >
          <BarList
            max={f.signed_up}
            rows={CHALLENGES.map((c) => {
              const n = s.per_challenge[c.slug] ?? 0;
              return {
                key: c.slug,
                label: `${c.number}. ${c.full_title}`,
                value: n,
                display: `${n} · ${pct(n, f.signed_up)}`,
                title: `${c.full_title} (${c.title_ka}): ${n} players`,
              };
            })}
          />
        </Card>

        {/* Feedback */}
        <Card
          title="„როგორი იყო?“ — how was it?"
          subtitle={`${f.rated} answer${f.rated === 1 ? "" : "s"} after finishing all 5`}
        >
          <BarList
            max={Math.max(1, f.rated)}
            rows={RATING_LABELS.map((r) => {
              const n = s.ratings[r.value] ?? 0;
              return {
                key: r.value,
                label: `${r.icon} ${r.ka}`,
                value: n,
                display: `${n} · ${pct(n, f.rated)}`,
                title: `${r.ka}: ${n}`,
              };
            })}
          />
        </Card>

        {/* Audience */}
        <Card title="Age" subtitle="Players by age">
          <ColumnChart
            height={120}
            columns={AGE_RANGE.map((a) => {
              const n = s.ages[String(a)] ?? 0;
              return {
                key: String(a),
                label: String(a),
                value: n,
                title: `Age ${a}: ${n} players (${pct(n, s.players_total)})`,
              };
            })}
          />
          <p className="mt-3 text-xs text-slate-400">
            Ages 10–13:{" "}
            <span className="font-semibold text-slate-200">
              {pct(
                [10, 11, 12, 13].reduce(
                  (t, a) => t + (s.ages[String(a)] ?? 0),
                  0,
                ),
                s.players_total,
              )}
            </span>{" "}
            of players
          </p>
        </Card>

        <Card title="Position" subtitle="Players by playing position">
          <BarList
            max={s.players_total}
            rows={POSITION_LABELS.map((p) => {
              const n = s.positions[p.value] ?? 0;
              return {
                key: p.value,
                label: p.en,
                value: n,
                display: `${n} · ${pct(n, s.players_total)}`,
                title: `${p.en} (${p.ka}): ${n}`,
              };
            })}
          />
        </Card>
      </div>
    </div>
  );
}
