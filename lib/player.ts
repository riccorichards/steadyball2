// lib/player.ts  (NEW FILE)
//
// Player profile, challenge progress and feedback.
// Local-first: everything is saved to localStorage immediately (the game never waits for the
// network), then synced to Supabase in the background. Supabase errors are logged, never shown.
//
// Identity: Supabase anonymous sign-in. Each device gets an auth user with no email/password,
// and Row Level Security lets that user write only their own rows (see supabase/schema.sql).

import { useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabase";
import { CHALLENGES, type ChallengeMeta } from "@/lib/challenges";

export type Position = "GK" | "DEF" | "MID" | "ATT";
export type Rating = "fire" | "great" | "ok";

export interface Profile {
  position: Position;
  age: number;
  /** Supabase auth user id, once the profile has reached the database. */
  playerId: string | null;
}

export const POSITIONS: { value: Position; label_ka: string; icon: string }[] = [
  { value: "GK", label_ka: "მეკარე", icon: "🧤" },
  { value: "DEF", label_ka: "მცველი", icon: "🛡️" },
  { value: "MID", label_ka: "ნახევარმცველი", icon: "⚙️" },
  { value: "ATT", label_ka: "თავდამსხმელი", icon: "⚡" },
];

export const AGES: number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16];

export const RATINGS: { value: Rating; icon: string; label_ka: string }[] = [
  { value: "fire", icon: "🔥", label_ka: "ცეცხლია" },
  { value: "great", icon: "⚽", label_ka: "მაგარია" },
  { value: "ok", icon: "😐", label_ka: "ნორმალური" },
];

/* ---------------------------------------------------------------------------
 * localStorage store (React-friendly via useSyncExternalStore)
 * ------------------------------------------------------------------------- */

const PROFILE_KEY = "sb.profile.v1";
const PROGRESS_KEY = "sb.progress.v1";
const RATING_KEY = "sb.rating.v1";
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

/* Snapshots are cached per raw string so useSyncExternalStore gets stable references. */
let profileRaw: string | null | undefined;
let profileVal: Profile | null = null;
export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = read(PROFILE_KEY);
  if (raw !== profileRaw) {
    profileRaw = raw;
    try {
      profileVal = raw ? (JSON.parse(raw) as Profile) : null;
    } catch {
      profileVal = null;
    }
  }
  return profileVal;
}

const NO_PROGRESS: string[] = [];
let progressRaw: string | null | undefined;
let progressVal: string[] = NO_PROGRESS;
export function getProgress(): string[] {
  if (typeof window === "undefined") return NO_PROGRESS;
  const raw = read(PROGRESS_KEY);
  if (raw !== progressRaw) {
    progressRaw = raw;
    try {
      progressVal = raw ? (JSON.parse(raw) as string[]) : NO_PROGRESS;
    } catch {
      progressVal = NO_PROGRESS;
    }
  }
  return progressVal;
}

export function getRating(): Rating | null {
  if (typeof window === "undefined") return null;
  return (read(RATING_KEY) as Rating | null) ?? null;
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

/** False during server render and hydration, true afterwards (localStorage is readable). */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
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

/** Makes sure the `players` row exists for this device. Returns the player id or null (offline). */
async function ensurePlayerRow(): Promise<string | null> {
  const profile = getProfile();
  if (!profile) return null;
  const id = await ensureUserId();
  const sb = getSupabase();
  if (!id || !sb) return null;
  if (profile.playerId === id) return id;

  const { error } = await sb.from("players").upsert({ id, position: profile.position, age: profile.age });
  if (error) {
    console.warn("[supabase] players upsert failed", error);
    return null;
  }
  write(PROFILE_KEY, JSON.stringify({ ...profile, playerId: id }));
  return id;
}

/** Sign-up from the home page. Saves locally at once; database sync happens in the background. */
export async function saveProfile(position: Position, age: number): Promise<void> {
  const previous = getProfile();
  const changed = !previous || previous.position !== position || previous.age !== age;
  write(PROFILE_KEY, JSON.stringify({ position, age, playerId: changed ? null : previous?.playerId ?? null }));

  const id = await ensurePlayerRow();
  // Push any challenges finished before the profile reached the database.
  if (id) await Promise.all(getProgress().map((slug) => pushCompletion(id, slug)));
}

async function pushCompletion(playerId: string, slug: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from("challenge_completions")
    .upsert({ player_id: playerId, challenge_slug: slug }, { onConflict: "player_id,challenge_slug", ignoreDuplicates: true });
  if (error) console.warn("[supabase] completion not saved", error);
}

/** Called when a challenge is won. Idempotent: replays don't create duplicates. */
export async function recordCompletion(slug: string): Promise<void> {
  const done = getProgress();
  if (!done.includes(slug)) write(PROGRESS_KEY, JSON.stringify([...done, slug]));
  const id = await ensurePlayerRow();
  if (id) await pushCompletion(id, slug);
}

/** "როგორი იყო?" answer on the finish page. */
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
