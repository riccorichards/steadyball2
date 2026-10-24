// lib/lessons.ts
//
// Browser only (it loads the player bundle): the lesson screen uses it. Lists for menus come from lib/challenges.ts.
// Every lesson in lessons/*.lesson.json (exported from Pitch Scenario Studio), checked and in play order.
// A broken file is skipped with a console error; scripts/build-lesson-index.mjs already refuses to
// start dev/build when one is broken, so this is only a safety net.
//
// Russian: a lesson exported without Russian text shows English to Russian players (the player
// itself would fall back to Georgian, which they can't read).

import { validateLesson, type Lesson } from "@pss/player";
import { LESSON_FILES } from "@/lessons/files";

/** Adds `ru` = English wherever a { ka, en } text has no Russian yet. Returns a copy. */
function withRussianFallback<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withRussianFallback) as T;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.ka === "string" && typeof o.en === "string" && Object.values(o).every((v) => typeof v === "string")) {
      return (o.ru ? o : { ...o, ru: o.en }) as T;
    }
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, withRussianFallback(v)])) as T;
  }
  return value;
}

export const LESSONS: Lesson[] = LESSON_FILES.flatMap((raw, i) => {
  const r = validateLesson(withRussianFallback(raw));
  if (r.ok) return [r.value];
  console.error(`[lessons] file #${i + 1} is not a valid lesson`, r.issues);
  return [];
});

export const getLesson = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
