// lib/tree.ts
//
// The knowledge tree: every lesson hangs on one branch, chosen by its `meta.topic` (set in the Studio).
// Branches are ordered from the roots (first skills) up to the crown (hardest ideas).
// A lesson with a topic not listed below lands on the last branch, so a new lesson never disappears.

import { CHALLENGES, type ChallengeMeta } from "@/lib/challenges";
import type { Lang } from "@/lib/i18n";

export interface Branch {
  id: string;
  name: Record<Lang, string>;
  /** One line under the name in the branch view. */
  tagline: Record<Lang, string>;
  icon: string;
  /** Leaf colour (hex) and its glow. */
  color: string;
  topics: string[];
}

export const BRANCHES: Branch[] = [
  {
    id: "get-open",
    name: { ka: "გაიხსენი", en: "Get open", ru: "Открывайся" },
    tagline: {
      ka: "იპოვე თავისუფალი სივრცე და მიიღე ბურთი",
      en: "Find free space and receive the ball",
      ru: "Найди свободное место и получи мяч",
    },
    icon: "👀",
    color: "#34d399",
    topics: ["free-space", "support-angles", "half-turn", "two-v-one"],
  },
  {
    id: "under-pressure",
    name: { ka: "წნეხის ქვეშ", en: "Under pressure", ru: "Под давлением" },
    tagline: {
      ka: "გაექეცი წნეხს და შეინარჩუნე ბურთი",
      en: "Escape the press and keep the ball",
      ru: "Уйди от прессинга и сохрани мяч",
    },
    icon: "🛡️",
    color: "#f472b6",
    topics: ["beat-the-press", "outnumbered"],
  },
  {
    id: "combinations",
    name: { ka: "კომბინაციები", en: "Combinations", ru: "Комбинации" },
    tagline: {
      ka: "სამკუთხედი, მესამე მოთამაშე, გადაბმა",
      en: "Triangles, the third man, overlaps",
      ru: "Треугольники, третий игрок, обгоны",
    },
    icon: "🔺",
    color: "#60a5fa",
    topics: ["third-man", "two-v-two", "three-v-two", "combination"],
  },
  {
    id: "in-behind",
    name: { ka: "ზურგს უკან", en: "In behind", ru: "За спину" },
    tagline: {
      ka: "გარბენი და პასი დაცვის ზურგს უკან",
      en: "Runs and passes behind the defence",
      ru: "Рывки и пасы за спину обороне",
    },
    icon: "⚡",
    color: "#fbbf24",
    topics: ["runs-in-behind", "through-ball", "cut-back", "build-up-to-goal"],
  },
  {
    id: "create-space",
    name: { ka: "შექმენი სივრცე", en: "Create space", ru: "Создай место" },
    tagline: {
      ka: "წაიყვანე მცველი და გაუხსენი გზა მეგობარს",
      en: "Pull a defender away, open the way for a teammate",
      ru: "Уведи защитника и открой путь партнёру",
    },
    icon: "🧠",
    color: "#c084fc",
    topics: ["creating-space", "rotation"],
  },
];

const LAST = BRANCHES[BRANCHES.length - 1];

export const branchOfTopic = (topic: string): Branch => BRANCHES.find((b) => b.topics.includes(topic)) ?? LAST;

/** Lessons of a branch, easiest first (difficulty, then file order). */
export const lessonsOf = (branchId: string): ChallengeMeta[] =>
  CHALLENGES.filter((c) => branchOfTopic(c.topic).id === branchId).sort(
    (a, b) => a.difficulty - b.difficulty || a.number - b.number,
  );

export const getBranch = (id: string): Branch | undefined => BRANCHES.find((b) => b.id === id);

export const branchOfLesson = (slug: string): Branch => {
  const c = CHALLENGES.find((x) => x.slug === slug);
  return c ? branchOfTopic(c.topic) : LAST;
};

/** First unfinished lesson of a branch, or null when the branch is complete. */
export const nextInBranch = (branchId: string, done: string[]): ChallengeMeta | null =>
  lessonsOf(branchId).find((c) => !done.includes(c.slug)) ?? null;

/** The branch to suggest: the first (from the roots) that still has unfinished lessons. */
export const suggestedBranch = (done: string[]): Branch | null =>
  BRANCHES.find((b) => nextInBranch(b.id, done) !== null) ?? null;
