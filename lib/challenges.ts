/** One entry per challenge page. The header renders these in order. */
export interface ChallengeMeta {
  slug: string;
  number: number;
  /** Short Georgian title for the header chip. */
  title_ka: string;
  /** Full title used in the browser tab. */
  full_title: string;
}

export const CHALLENGES: ChallengeMeta[] = [
  { slug: "half-turn", number: 1, title_ka: "ხედვის კუთხე", full_title: "Half-Turn" },
  { slug: "triangle", number: 2, title_ka: "სამკუთხედი", full_title: "Passing Triangle" },
  { slug: "cut-back", number: 3, title_ka: "Cut-Back", full_title: "Cut-Back" },
  { slug: "curved-run", number: 4, title_ka: "რკალისებრი გარბენი", full_title: "Curved Run" },
  { slug: "third-man", number: 5, title_ka: "მესამე კაცი", full_title: "Third Man" },
];

export const challengeHref = (slug: string): string => `/challenges/${slug}`;

export const getChallenge = (slug: string): ChallengeMeta => {
  const c = CHALLENGES.find((ch) => ch.slug === slug);
  if (!c) throw new Error(`Unknown challenge: ${slug}`);
  return c;
};
