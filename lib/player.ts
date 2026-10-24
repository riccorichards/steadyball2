// lib/player.ts
//
// Player profile, progress, XP, invite source and feedback.
// Local-first: everything is saved to localStorage immediately (the game never waits for the
// network), then synced to Supabase in the background. Supabase errors are logged, never shown.
//
// Identity: Supabase anonymous sign-in. Each device gets an auth user with no email/password,
// and Row Level Security lets that user write only their own rows (see supabase/*.sql).
// No name, email or phone is ever collected: the players are children.

import { useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase";
import { CHALLENGES, type ChallengeMeta } from "@/lib/challenges";
import { getLang, type Lang, type StringKey } from "@/lib/i18n";

export type Position = "GK" | "DEF" | "MID" | "ATT";
export type Rating = "fire" | "great" | "ok";

export interface Profile {
  position: Position;
  age: number;
  /** Supabase auth user id, once the profile has reached the database. */
  playerId: string | null;
  /** Version of the player row last written (2 = with invite, language, country). */
  syncedV?: number;
}

export const POSITIONS: { value: Position; label: StringKey; icon: string }[] = [
  { value: "GK", label: "posGK", icon: "🧤" },
  { value: "DEF", label: "posDEF", icon: "🛡️" },
  { value: "MID", label: "posMID", icon: "⚙️" },
  { value: "ATT", label: "posATT", icon: "⚡" },
];

export const AGES: number[] = [9, 10, 11, 12, 13];

export const RATINGS: { value: Rating; icon: string; label: StringKey }[] = [
  { value: "fire", icon: "🔥", label: "rateFire" },
  { value: "great", icon: "⚽", label: "rateGreat" },
  { value: "ok", icon: "😐", label: "rateOk" },
];

const ROW_VERSION = 2;

/* ---------------------------------------------------------------------------
 * localStorage store (React-friendly via useSyncExternalStore)
 * ------------------------------------------------------------------------- */

const PROFILE_KEY = "sb.profile.v1";
const PROGRESS_KEY = "sb.progress.v1";
const RATING_KEY = "sb.rating.v1";
const XP_KEY = "sb.xp.v1";
const INVITE_KEY = "sb.invite.v1";
const DAY_KEY = "sb.day.v1";
const CHANGE_EVENT = "sb:store";

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / storage full: keep going in memory */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

/** JSON value cached per raw string, so useSyncExternalStore gets stable references. */
function cachedJson<T>(key: string, fallback: T): () => T {
  let raw: string | null | undefined;
  let val: T = fallback;
  return () => {
    if (typeof window === "undefined") return fallback;
    const next = read(key);
    if (next !== raw) {
      raw = next;
      try {
        val = next ? (JSON.parse(next) as T) : fallback;
      } catch {
        val = fallback;
      }
    }
    return val;
  };
}

const NO_PROGRESS: string[] = [];
const NO_XP: Record<string, number> = {};

export const getProfile = cachedJson<Profile | null>(PROFILE_KEY, null);
export const getProgress = cachedJson<string[]>(PROGRESS_KEY, NO_PROGRESS);
export const getXpMap = cachedJson<Record<string, number>>(XP_KEY, NO_XP);

export function getRating(): Rating | null {
  if (typeof window === "undefined") return null;
  return (read(RATING_KEY) as Rating | null) ?? null;
}

/** Invite code this device first arrived with (first touch wins), or null for direct visits. */
export function getInvite(): string | null {
  if (typeof window === "undefined") return null;
  return read(INVITE_KEY);
}

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

export const useProfile = (): Profile | null => useSyncExternalStore(subscribe, getProfile, () => null);
export const useProgress = (): string[] => useSyncExternalStore(subscribe, getProgress, () => NO_PROGRESS);
export const useRating = (): Rating | null => useSyncExternalStore(subscribe, getRating, () => null);
export const useXpMap = (): Record<string, number> => useSyncExternalStore(subscribe, getXpMap, () => NO_XP);

/** False during server render and hydration, true afterwards (localStorage is readable). */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

/** Next unfinished challenge after `currentSlug` (wraps around), or null when all are done. */
export function nextChallenge(done: string[], currentSlug?: string): ChallengeMeta | null {
  const start = currentSlug ? CHALLENGES.findIndex((c) => c.slug === currentSlug) + 1 : 0;
  for (let i = 0; i < CHALLENGES.length; i += 1) {
    const c = CHALLENGES[(start + i) % CHALLENGES.length];
    if (!done.includes(c.slug)) return c;
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * Invite links
 * ------------------------------------------------------------------------- */

export const INVITE_CODE_RE = /^[a-z0-9-]{2,40}$/;

/** Remember the invite code from the link (first touch wins: later links don't overwrite it). */
export function captureInvite(raw: string): void {
  const code = raw.trim().toLowerCase();
  if (!INVITE_CODE_RE.test(code) || getInvite()) return;
  write(INVITE_KEY, code);
}

/* ---------------------------------------------------------------------------
 * Supabase sync
 * ------------------------------------------------------------------------- */

let userIdPromise: Promise<string | null> | null = null;

/** Signed-in user id, creating an anonymous user the first time. One sign-in even if called in parallel. */
function ensureUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return Promise.resolve(null);
  if (!userIdPromise) {
    userIdPromise = (async () => {
      const { data } = await sb.auth.getSession();
      if (data.session?.user) return data.session.user.id;
      const { data: signIn, error } = await sb.auth.signInAnonymously();
      if (error) throw error;
      return signIn.user?.id ?? null;
    })().catch((e: unknown) => {
      console.warn("[supabase] anonymous sign-in failed", e);
      userIdPromise = null; // retry next time
      return null;
    });
  }
  return userIdPromise;
}

/** Country code from the hosting edge (Vercel), e.g. "GE". Null when unknown. */
async function fetchCountry(): Promise<string | null> {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (!res.ok) return null;
    const { country } = (await res.json()) as { country: string | null };
    return country;
  } catch {
    return null;
  }
}

let rowPromise: Promise<string | null> | null = null;

/** Makes sure the `players` row exists (and is up to date) for this device. Returns the player id or null (offline). */
function ensurePlayerRow(): Promise<string | null> {
  if (!rowPromise) {
    rowPromise = (async () => {
      const profile = getProfile();
      if (!profile) return null;
      const id = await ensureUserId();
      const sb = getSupabase();
      if (!id || !sb) return null;
      if (profile.playerId === id && (profile.syncedV ?? 1) >= ROW_VERSION) return id;

      const row: Record<string, unknown> = {
        id,
        position: profile.position,
        age: profile.age,
        lang: getLang(),
        invite_code: getInvite(),
      };
      const country = await fetchCountry();
      if (country) row.country = country;
      const { error } = await sb.from("players").upsert(row);
      if (error) {
        console.warn("[supabase] players upsert failed", error);
        return null;
      }
      write(PROFILE_KEY, JSON.stringify({ ...getProfile(), playerId: id, syncedV: ROW_VERSION }));
      return id;
    })().finally(() => {
      rowPromise = null;
    });
  }
  return rowPromise;
}

/** Sign-up from the home page. Saves locally at once; database sync happens in the background. */
export async function saveProfile(position: Position, age: number): Promise<void> {
  const previous = getProfile();
  const changed = !previous || previous.position !== position || previous.age !== age;
  write(
    PROFILE_KEY,
    JSON.stringify({
      position,
      age,
      playerId: changed ? null : previous?.playerId ?? null,
      syncedV: changed ? 0 : previous?.syncedV,
    }),
  );

  const id = await ensurePlayerRow();
  // Push any challenges finished before the profile reached the database.
  if (id) await Promise.all(getProgress().map((slug) => pushCompletion(id, slug)));
}

export interface CompletionStats {
  xp: number;
  attempts: number;
  msTotal: number;
  hintLevels: number;
}

async function pushCompletion(playerId: string, slug: string, stats?: CompletionStats): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const row: Record<string, unknown> = { player_id: playerId, challenge_slug: slug };
  if (stats) {
    row.xp = stats.xp;
    row.attempts = stats.attempts;
    row.ms_total = Math.round(stats.msTotal);
    row.hint_levels = stats.hintLevels;
  }
  const { error } = await sb
    .from("challenge_completions")
    .upsert(row, { onConflict: "player_id,challenge_slug", ignoreDuplicates: true });
  if (error) console.warn("[supabase] completion not saved", error);
}

/** Called when a challenge is won. Idempotent: replays don't create duplicates (best XP is kept locally). */
export async function recordCompletion(slug: string, stats?: CompletionStats): Promise<void> {
  const done = getProgress();
  if (!done.includes(slug)) write(PROGRESS_KEY, JSON.stringify([...done, slug]));
  if (stats) {
    const xp = getXpMap();
    if ((xp[slug] ?? 0) < stats.xp) write(XP_KEY, JSON.stringify({ ...xp, [slug]: stats.xp }));
  }
  const id = await ensurePlayerRow();
  if (id) await pushCompletion(id, slug, stats);
}

export interface AttemptStats {
  lessonId: string;
  attempt: number;
  result: string;
  failKey?: string;
  msOnTask: number;
  stage: number;
  timedOut: boolean;
}

/** Every Check press: which lessons are hard, and why kids miss them. Fire-and-forget. */
export async function recordAttempt(a: AttemptStats): Promise<void> {
  const id = await ensurePlayerRow();
  const sb = getSupabase();
  if (!id || !sb) return;
  const { error } = await sb.from("lesson_attempts").insert({
    player_id: id,
    lesson_id: a.lessonId,
    attempt: a.attempt,
    result: a.result,
    fail_key: a.failKey ?? null,
    ms_on_task: Math.round(a.msOnTask),
    stage: a.stage,
    timed_out: a.timedOut,
  });
  if (error) console.warn("[supabase] attempt not saved", error);
}

/** Once a day per device: marks the player active today (for "came back" numbers). */
export async function touchToday(): Promise<void> {
  if (!getProfile()) return;
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, phone's local day
  if (read(DAY_KEY) === today) return;
  const id = await ensurePlayerRow();
  const sb = getSupabase();
  if (!id || !sb) return;
  const { error } = await sb
    .from("player_days")
    .upsert({ player_id: id, day: today }, { onConflict: "player_id,day", ignoreDuplicates: true });
  if (error) {
    console.warn("[supabase] activity not saved", error);
    return;
  }
  try {
    window.localStorage.setItem(DAY_KEY, today);
  } catch {
    /* ignore */
  }
}

/** Language changed in the app: keep the player row current. */
export async function syncLang(lang: Lang): Promise<void> {
  const profile = getProfile();
  const sb = getSupabase();
  if (!profile?.playerId || !sb) return;
  const { error } = await sb.from("players").update({ lang }).eq("id", profile.playerId);
  if (error) console.warn("[supabase] language not saved", error);
}

/** "How was it?" answer. */
export async function submitFeedback(rating: Rating): Promise<void> {
  write(RATING_KEY, rating);
  const id = await ensurePlayerRow();
  const sb = getSupabase();
  if (!id || !sb) return;
  const { error } = await sb
    .from("feedback")
    .upsert({ player_id: id, rating, created_at: new Date().toISOString() }, { onConflict: "player_id" });
  if (error) console.warn("[supabase] feedback not saved", error);
}
