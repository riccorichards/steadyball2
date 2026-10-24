// lib/challenges.ts
//
// The challenge list: one entry per lesson file in lessons/, in file-name order.
// The tree, lesson pages, progress and the dashboard are all built from it.

import { LESSON_META } from "@/lessons";
import type { Lang } from "@/lib/i18n";

export interface ChallengeMeta {
  slug: string;
  number: number;
  title: Record<Lang, string>;
  /** Short Georgian title (kept for older code). */
  title_ka: string;
  /** English title, used in the browser tab and the dashboard. */
  full_title: string;
  topic: string;
  level: string;
  difficulty: number;
}

export const CHALLENGES: ChallengeMeta[] = LESSON_META.map((l, i) => ({
  slug: l.id,
  number: i + 1,
  title: l.title,
  title_ka: l.title.ka,
  full_title: l.title.en,
  topic: l.topic,
  level: l.level,
  difficulty: l.difficulty,
}));

export const challengeHref = (slug: string): string => `/lesson/${slug}`;

export const getChallenge = (slug: string): ChallengeMeta | undefined => CHALLENGES.find((ch) => ch.slug === slug);
