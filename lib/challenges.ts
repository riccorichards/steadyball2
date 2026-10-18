// lib/challenges.ts
//
// The challenge list: one entry per lesson file in lessons/, in file-name order.
// The header, home page, end-of-challenge buttons and finish page are all built from it.

import { LESSON_META } from "@/lessons";

export interface ChallengeMeta {
  slug: string;
  number: number;
  /** Short Georgian title for the header chip. */
  title_ka: string;
  /** Full title used in the browser tab. */
  full_title: string;
}

export const CHALLENGES: ChallengeMeta[] = LESSON_META.map((l, i) => ({
  slug: l.id,
  number: i + 1,
  title_ka: l.title_ka,
  full_title: l.title_en,
}));

export const challengeHref = (slug: string): string => `/lesson/${slug}`;

/** The five hand-built pilot pages (/challenges/<slug>), kept for comparison. Not in the list above. */
const PILOT: ChallengeMeta[] = [
  { slug: "half-turn", number: 1, title_ka: "ხედვის კუთხე", full_title: "Half-Turn" },
  { slug: "triangle", number: 2, title_ka: "სამკუთხედი", full_title: "Passing Triangle" },
  { slug: "cut-back", number: 3, title_ka: "Cut-Back", full_title: "Cut-Back" },
  { slug: "curved-run", number: 4, title_ka: "რკალისებრი გარბენი", full_title: "Curved Run" },
  { slug: "third-man", number: 5, title_ka: "მესამე კაცი", full_title: "Third Man" },
];

export const getChallenge = (slug: string): ChallengeMeta => {
  const c = CHALLENGES.find((ch) => ch.slug === slug) ?? PILOT.find((ch) => ch.slug === slug);
  if (!c) throw new Error(`Unknown challenge: ${slug}`);
  return c;
};
