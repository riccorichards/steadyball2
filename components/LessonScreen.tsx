// components/LessonScreen.tsx
//
// One screen for every lesson: the Studio's player in SteadyBall's look, wired to progress.
// - text in the player's language (ka / en / ru);
// - every Check press is recorded (which lessons are hard, and why);
// - a win records the completion with its XP, attempts and time;
// - "Next" goes to the next unfinished lesson of the same branch, back to the branch when it's
//   complete, or to the finish page when everything is done;
// - a slim top bar: ← back to the branch, the lesson title, its place in the branch.

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { AttemptEvent, CompleteEvent } from "@pss/player";
import { CHALLENGES, challengeHref } from "@/lib/challenges";
import { pick, useT } from "@/lib/i18n";
import { getLesson } from "@/lib/lessons";
import { getProgress, recordAttempt, recordCompletion, useHydrated, useProfile } from "@/lib/player";
import { branchOfLesson, lessonsOf, nextInBranch } from "@/lib/tree";

// The player measures the screen and plays sound, so it only runs in the browser.
const LessonPlayer = dynamic(() => import("@pss/player").then((m) => m.LessonPlayer), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-950" />,
});

export default function LessonScreen({ id }: { id: string }): React.JSX.Element | null {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();
  const { lang, t } = useT();
  const lesson = getLesson(id);
  const branch = branchOfLesson(id);

  // Only signed-up players play (so every attempt has an age and position behind it).
  useEffect(() => {
    if (hydrated && !profile) router.replace("/");
  }, [hydrated, profile, router]);

  const onAttempt = useCallback((e: AttemptEvent) => {
    void recordAttempt({
      lessonId: e.lessonId,
      attempt: e.attempt,
      result: e.result,
      failKey: e.failKey,
      msOnTask: e.msOnTask,
      stage: e.stage,
      timedOut: e.timedOut,
    });
  }, []);

  const onComplete = useCallback(
    (e: CompleteEvent) => {
      void recordCompletion(id, { xp: e.xp, attempts: e.attempts, msTotal: e.msTotal, hintLevels: e.hintLevels });
    },
    [id],
  );

  const onNext = useCallback(() => {
    const done = getProgress();
    const withThis = done.includes(id) ? done : [...done, id];
    const next = nextInBranch(branch.id, withThis);
    if (next) router.push(challengeHref(next.slug));
    else if (CHALLENGES.every((c) => withThis.includes(c.slug))) router.push("/finish");
    else router.push(`/tree/${branch.id}`);
  }, [id, branch.id, router]);

  if (!lesson || !hydrated || !profile) return <div className="h-full w-full bg-slate-950" />;
  const meta = CHALLENGES.find((c) => c.slug === id);
  const branchLessons = lessonsOf(branch.id);
  const place = branchLessons.findIndex((c) => c.slug === id) + 1;
  return (
    <div className="flex h-full w-full flex-col bg-slate-950">
      {/* slim top bar: back to the branch, where we are */}
      <div className="flex h-[calc(48px+env(safe-area-inset-top))] shrink-0 items-center gap-2 px-2 pt-[env(safe-area-inset-top)]">
        <Link
          href={`/tree/${branch.id}`}
          aria-label={t("back")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-100">
          {branch.icon} {meta ? pick(meta.title, lang) : ""}
        </p>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums"
          style={{ background: `${branch.color}26`, color: branch.color }}
        >
          {place}/{branchLessons.length}
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <LessonPlayer key={`${id}-${lang}`} lesson={lesson} lang={lang} onAttempt={onAttempt} onComplete={onComplete} onNext={onNext} />
      </div>
    </div>
  );
}
