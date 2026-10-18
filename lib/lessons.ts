// lib/lessons.ts
//
// Browser only (it loads the player bundle): the lesson screen uses it. Lists for menus come from lib/challenges.ts.
// Every lesson in lessons/*.lesson.json (exported from Pitch Scenario Studio), checked and in play order.
// A broken file is skipped with a console error; scripts/build-lesson-index.mjs already refuses to
// start dev/build when one is broken, so this is only a safety net.

import { validateLesson, type Lesson } from "@pss/player";
import { LESSON_FILES } from "@/lessons/files";

export const LESSONS: Lesson[] = LESSON_FILES.flatMap((raw, i) => {
  const r = validateLesson(raw);
  if (r.ok) return [r.value];
  console.error(`[lessons] file #${i + 1} is not a valid lesson`, r.issues);
  return [];
});

export const getLesson = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
