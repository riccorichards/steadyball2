// app/admin/page.tsx
//
// Investor / admin dashboard. Totals only — no individual player rows are ever shown (players are children).
// Data: one call to the admin_stats() SQL function (supabase/admin.sql) with the service-role key.
// Also: create and manage invite links (/i/<code>), each with its own numbers.

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Archive, ArchiveRestore, LogOut, Plus, RefreshCw } from "lucide-react";
import { isAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CHALLENGES } from "@/lib/challenges";
import { BRANCHES, branchOfTopic } from "@/lib/tree";
import { BarList, Card, ColumnChart, StatTile } from "@/components/admin/charts";
import CopyLink from "@/components/admin/CopyLink";
import { logout } from "./actions";
import { createInvite, setInviteArchived } from "./invite-actions";

export const dynamic = "force-dynamic";

interface SourceStats {
  code: string;
  players: number;
  new_7d: number;
  active_7d: number;
  came_back: number;
  played: number;
  done_10: number;
  avg_done: number;
}

interface InviteStats extends SourceStats {
  label: string;
  kind: "team" | "social" | "partner" | "other";
  default_lang: "ka" | "en" | "ru" | null;
  archived: boolean;
  created_at: string;
}

interface Stats {
  generated_at: string;
  players_total: number;
  players_7d: number;
  players_prev_7d: number;
  active_7d: number;
  retention: { eligible_1d: number; came_back_1d: number; eligible_7d: number; came_back_7d: number };
  done_hist: Record<string, number>;
  completions_total: number;
  checks_total: number;
  rated: number;
  per_challenge: Record<string, number>;
  lesson_tries: Record<string, { checks: number; wrong: number; players: number; top_fail: string | null }>;
  ages: Record<string, number>;
  positions: Record<string, number>;
  langs: Record<string, number>;
  countries: Record<string, number>;
  ratings: Record<string, number>;
  daily: { day: string; signups: number; active: number }[];
  invites: InviteStats[];
  other_sources: SourceStats[];
}

const POSITION_LABELS = [
  { value: "GK", en: "Goalkeeper" },
  { value: "DEF", en: "Defender" },
  { value: "MID", en: "Midfielder" },
  { value: "ATT", en: "Forward" },
];
const RATING_LABELS = [
  { value: "fire", icon: "🔥", en: "Fire" },
  { value: "great", icon: "⚽", en: "Great" },
  { value: "ok", icon: "😐", en: "Okay" },
];
const LANG_LABELS: Record<string, string> = { ka: "Georgian", en: "English", ru: "Russian", "?": "Not recorded yet" };
const KIND_LABELS: Record<string, string> = { team: "Team", social: "Social", partner: "Partner", other: "Other" };
const AGE_RANGE = [8, 9, 10, 11, 12, 13, 14];

const pct = (part: number, whole: number): string => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

const growth = (now: number, prev: number): string => {
  if (prev === 0) return now > 0 ? "new this week" : "no signups yet";
  const change = Math.round(((now - prev) / prev) * 100);
  return `${change >= 0 ? "+" : ""}${change}% vs previous week`;
};

const dayLabel = (iso: string): string =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

const countryName = (code: string): string => {
  if (code === "?") return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

const flag = (code: string): string =>
  /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "🌐";

async function loadStats(): Promise<{ stats: Stats | null; error: string | null }> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("admin_stats");
    if (error) throw new Error(error.message);
    return { stats: data as Stats, error: null };
  } catch (e) {
    return { stats: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ invite_error?: string; invite_created?: string }>;
}): Promise<React.JSX.Element> {
  if (!(await isAdmin())) redirect("/admin/login");
  const [{ stats, error }, sp, h] = await Promise.all([loadStats(), searchParams, headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const updated = stats
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tbilisi" }).format(
        new Date(stats.generated_at),
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">SteadyBall · Dashboard</h1>
          {updated && <p className="mt-0.5 text-xs text-slate-500">Updated {updated} (Tbilisi time)</p>}
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
            Run <code>supabase/002_invites_progress.sql</code> and then <code>supabase/admin.sql</code> in Supabase, and check that{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> is set.
          </p>
        </div>
      )}

      {stats && <Dashboard s={stats} origin={origin} inviteError={sp.invite_error} inviteCreated={sp.invite_created} />}
    </div>
  );
}

function Dashboard({
  s,
  origin,
  inviteError,
  inviteCreated,
}: {
  s: Stats;
  origin: string;
  inviteError?: string;
  inviteCreated?: string;
}): React.JSX.Element {
  const total = CHALLENGES.length;
  const players = s.players_total;
  const doneOf = (min: number): number =>
    Object.entries(s.done_hist).reduce((sum, [k, n]) => (Number(k) >= min ? sum + n : sum), 0);
  const played = doneOf(1);
  const avgDone = players > 0 ? (s.completions_total / players).toFixed(1) : "0";
  const loved = (s.ratings.fire ?? 0) + (s.ratings.great ?? 0);
  const r = s.retention;

  const buckets: { key: string; label: string; min: number; max: number }[] = [
    { key: "0", label: "Signed up, no lesson yet", min: 0, max: 0 },
    { key: "1", label: "1–4 lessons", min: 1, max: 4 },
    { key: "5", label: "5–9 lessons", min: 5, max: 9 },
    { key: "10", label: "10–24 lessons", min: 10, max: 24 },
    { key: "25", label: "25–49 lessons", min: 25, max: 49 },
    { key: "50", label: `50–${total - 1} lessons`, min: 50, max: total - 1 },
    { key: "all", label: `All ${total}`, min: total, max: 10_000 },
  ];
  const inBucket = (min: number, max: number): number =>
    Object.entries(s.done_hist).reduce((sum, [k, n]) => (Number(k) >= min && Number(k) <= max ? sum + n : sum), 0);

  const hardest = CHALLENGES.map((c) => ({ c, t: s.lesson_tries[c.slug] }))
    .filter((x) => x.t && x.t.checks >= 5)
    .sort((a, b) => b.t.wrong / b.t.checks - a.t.wrong / a.t.checks)
    .slice(0, 10);

  const sources: (SourceStats & { label: string; kind: string; link: string | null; archived: boolean; lang: string | null })[] = [
    ...s.invites.map((i) => ({ ...i, link: `${origin}/i/${i.code}`, lang: i.default_lang })),
    ...s.other_sources.map((o) => ({
      ...o,
      label: o.code === "" ? "No link (came directly)" : `Unknown code “${o.code}”`,
      kind: "—",
      link: null,
      archived: false,
      lang: null,
    })),
  ];

  return (
    <div className="mt-6 space-y-4">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Players" value={`${players}`} sub={`+${s.players_7d} this week · ${growth(s.players_7d, s.players_prev_7d)}`} />
        <StatTile label="Active this week" value={`${s.active_7d}`} sub={`${pct(s.active_7d, players)} of all players opened the app in the last 7 days`} />
        <StatTile label="Came back another day" value={pct(r.came_back_1d, r.eligible_1d)} sub={`${r.came_back_1d} of ${r.eligible_1d} · after a week: ${pct(r.came_back_7d, r.eligible_7d)}`} />
        <StatTile label="Lessons per player" value={avgDone} sub={`${pct(played, players)} played at least one · ${s.checks_total} answers checked`} />
      </div>

      {/* Invite links */}
      <Card title="Invite links" subtitle="Each link counts the players it brought. Share a team link with that team only." className="scroll-mt-6" >
        <div id="invites" />
        <form action={createInvite} className="grid gap-2 sm:grid-cols-[2fr_1.3fr_1fr_1fr_auto]">
          <input
            name="label"
            required
            maxLength={80}
            placeholder="Name, e.g. Dinamo Batumi U12"
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-500"
          />
          <input
            name="code"
            maxLength={40}
            placeholder="Code (optional), e.g. dinamo-u12"
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 font-mono text-sm placeholder:font-sans placeholder:text-slate-500"
          />
          <select name="kind" defaultValue="team" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm">
            <option value="team">Team</option>
            <option value="partner">Partner / coach</option>
            <option value="social">Social media</option>
            <option value="other">Other</option>
          </select>
          <select name="lang" defaultValue="" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm">
            <option value="">Language: phone’s</option>
            <option value="ka">Georgian</option>
            <option value="en">English</option>
            <option value="ru">Russian</option>
          </select>
          <button type="submit" className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
            <Plus className="h-4 w-4" /> Create
          </button>
        </form>
        {inviteError && <p className="mt-2 text-sm text-rose-300">{inviteError}</p>}
        {inviteCreated && (
          <p className="mt-2 text-sm text-emerald-300">
            Link created: <span className="font-mono">{origin}/i/{inviteCreated}</span>
          </p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-semibold">Source</th>
                <th className="py-2 pr-3 font-semibold">Link</th>
                <th className="py-2 pr-3 text-right font-semibold">Players</th>
                <th className="py-2 pr-3 text-right font-semibold">New 7d</th>
                <th className="py-2 pr-3 text-right font-semibold">Active 7d</th>
                <th className="py-2 pr-3 text-right font-semibold">Played</th>
                <th className="py-2 pr-3 text-right font-semibold">Came back</th>
                <th className="py-2 pr-3 text-right font-semibold">≥10 lessons</th>
                <th className="py-2 pr-3 text-right font-semibold">Avg lessons</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sources.map((src) => (
                <tr key={`${src.link ?? "x"}-${src.code}`} className={src.archived ? "opacity-45" : ""}>
                  <td className="py-2.5 pr-3">
                    <p className="font-semibold text-slate-100">{src.label}</p>
                    <p className="text-[11px] text-slate-500">
                      {KIND_LABELS[src.kind] ?? src.kind}
                      {src.lang ? ` · opens in ${LANG_LABELS[src.lang]}` : ""}
                      {src.archived ? " · archived" : ""}
                    </p>
                  </td>
                  <td className="max-w-[240px] py-2.5 pr-3">{src.link ? <CopyLink url={src.link} /> : <span className="text-slate-600">—</span>}</td>
                  <td className="py-2.5 pr-3 text-right font-bold tabular-nums">{src.players}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{src.new_7d}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{src.active_7d}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{pct(src.played, src.players)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{pct(src.came_back, src.players)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{src.done_10}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-slate-300">{src.avg_done}</td>
                  <td className="py-2.5 text-right">
                    {src.link && (
                      <form action={setInviteArchived}>
                        <input type="hidden" name="code" value={src.code} />
                        <input type="hidden" name="archived" value={src.archived ? "false" : "true"} />
                        <button
                          type="submit"
                          title={src.archived ? "Restore" : "Archive (the link keeps working; it just moves down)"}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-slate-200"
                        >
                          {src.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500">
                    No links yet. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="New players, last 30 days" subtitle={`${s.daily.reduce((t, d) => t + d.signups, 0)} signups in 30 days`}>
          <ColumnChart
            labelEvery={7}
            columns={s.daily.map((d) => ({ key: d.day, label: dayLabel(d.day), value: d.signups, title: `${dayLabel(d.day)}: ${d.signups} new` }))}
          />
        </Card>
        <Card title="Players active each day" subtitle="Opened the app that day (new and returning)">
          <ColumnChart
            labelEvery={7}
            columns={s.daily.map((d) => ({ key: d.day, label: dayLabel(d.day), value: d.active, title: `${dayLabel(d.day)}: ${d.active} active` }))}
          />
        </Card>

        <Card title="How far players get" subtitle={`Lessons finished per player · ${total} lessons in the app`}>
          <BarList
            max={players}
            rows={buckets.map((b) => {
              const n = inBucket(b.min, b.max);
              return { key: b.key, label: b.label, value: n, display: `${n} · ${pct(n, players)}`, title: `${b.label}: ${n} players` };
            })}
          />
        </Card>

        <Card title="Branches of the tree" subtitle="Average players per lesson in each branch">
          <BarList
            rows={BRANCHES.map((b) => {
              const lessons = CHALLENGES.filter((c) => branchOfTopic(c.topic).id === b.id);
              const sum = lessons.reduce((t, c) => t + (s.per_challenge[c.slug] ?? 0), 0);
              const avg = lessons.length ? Math.round((sum / lessons.length) * 10) / 10 : 0;
              return { key: b.id, label: `${b.icon} ${b.name.en}`, value: avg, display: `${avg} · ${lessons.length} lessons`, title: `${b.name.en}: ${sum} completions` };
            })}
          />
        </Card>

        <Card title="Hardest lessons" subtitle="Share of wrong answers (lessons with 5+ answers checked)">
          {hardest.length === 0 ? (
            <p className="text-sm text-slate-500">Not enough answers yet.</p>
          ) : (
            <BarList
              max={100}
              rows={hardest.map(({ c, t }) => ({
                key: c.slug,
                label: c.full_title,
                value: Math.round((t.wrong / t.checks) * 100),
                display: `${pct(t.wrong, t.checks)}${t.top_fail ? ` · ${t.top_fail}` : ""}`,
                title: `${c.full_title}: ${t.wrong} wrong of ${t.checks} checks by ${t.players} players · most common mistake: ${t.top_fail ?? "—"}`,
              }))}
            />
          )}
        </Card>

        <Card title="„როგორი იყო?“ — how was it?" subtitle={`${s.rated} answers · ${pct(loved, s.rated)} said 🔥 or ⚽ (asked after 5 lessons)`}>
          <BarList
            max={Math.max(1, s.rated)}
            rows={RATING_LABELS.map((x) => {
              const n = s.ratings[x.value] ?? 0;
              return { key: x.value, label: `${x.icon} ${x.en}`, value: n, display: `${n} · ${pct(n, s.rated)}`, title: `${x.en}: ${n}` };
            })}
          />
        </Card>

        <Card title="Countries" subtitle="Where players opened the app from (no addresses are stored)">
          <BarList
            max={players}
            rows={Object.entries(s.countries)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([code, n]) => ({ key: code, label: `${flag(code)} ${countryName(code)}`, value: n, display: `${n} · ${pct(n, players)}`, title: `${countryName(code)}: ${n}` }))}
          />
        </Card>

        <Card title="Language" subtitle="Language each player uses in the app">
          <BarList
            max={players}
            rows={Object.entries(s.langs)
              .sort((a, b) => b[1] - a[1])
              .map(([code, n]) => ({ key: code, label: LANG_LABELS[code] ?? code, value: n, display: `${n} · ${pct(n, players)}`, title: `${LANG_LABELS[code] ?? code}: ${n}` }))}
          />
        </Card>

        <Card title="Age" subtitle="Players by age">
          <ColumnChart
            height={120}
            columns={AGE_RANGE.map((a) => {
              const n = s.ages[String(a)] ?? 0;
              return { key: String(a), label: String(a), value: n, title: `Age ${a}: ${n} players (${pct(n, players)})` };
            })}
          />
        </Card>

        <Card title="Position" subtitle="Players by playing position">
          <BarList
            max={players}
            rows={POSITION_LABELS.map((p) => {
              const n = s.positions[p.value] ?? 0;
              return { key: p.value, label: p.en, value: n, display: `${n} · ${pct(n, players)}`, title: `${p.en}: ${n}` };
            })}
          />
        </Card>
      </div>
    </div>
  );
}
