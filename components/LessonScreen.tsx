// components/LessonScreen.tsx
//
// One screen for every lesson: the Studio's player in SteadyBall's look, wired to progress.
// A win records the completion (local first, Supabase in the background); "Next" goes to the
// next unfinished lesson, or to the finish page when all are done.

"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { challengeHref } from "@/lib/challenges";
import { getLesson } from "@/lib/lessons";
import { getProgress, nextChallenge, recordCompletion } from "@/lib/player";

// The player measures the screen and plays sound, so it only runs in the browser.
const LessonPlayer = dynamic(() => import("@pss/player").then((m) => m.LessonPlayer), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-950" />,
});

export default function LessonScreen({ id }: { id: string }): React.JSX.Element | null {
  const router = useRouter();
  const lesson = getLesson(id);

  const onComplete = useCallback(() => {
    void recordCompletion(id);
  }, [id]);

  const onNext = useCallback(() => {
    const done = getProgress();
    const next = nextChallenge(done.includes(id) ? done : [...done, id], id);
    router.push(next ? challengeHref(next.slug) : "/finish");
  }, [id, router]);

  if (!lesson) return null;
  return (
    <div className="h-full w-full bg-slate-950">
      <LessonPlayer key={id} lesson={lesson} lang="ka" onComplete={onComplete} onNext={onNext} />
    </div>
  );
}
