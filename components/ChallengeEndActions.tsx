// components/ChallengeEndActions.tsx  (NEW FILE)
//
// Buttons at the bottom of every victory modal:
//   • primary  → the next unfinished challenge, or "finish" once all five are done
//   • secondary → replay this challenge
// Mounting it means the challenge was just won, so it also records the completion.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Flag, RotateCcw } from "lucide-react";
import { CHALLENGES, challengeHref } from "@/lib/challenges";
import { nextChallenge, recordCompletion, useProgress } from "@/lib/player";

interface Props {
  onReplay: () => void;
}

export default function ChallengeEndActions({ onReplay }: Props): React.JSX.Element {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";

  useEffect(() => {
    void recordCompletion(slug);
  }, [slug]);

  const stored = useProgress();
  const done = stored.includes(slug) ? stored : [...stored, slug];
  const next = nextChallenge(done, slug);

  return (
    <div className="mt-5">
      {/* progress dots */}
      <div className="mb-3 flex items-center justify-center gap-1.5" aria-label={`${done.length}/${CHALLENGES.length}`}>
        {CHALLENGES.map((c) => (
          <span
            key={c.slug}
            className={`h-2 rounded-full transition-all ${
              c.slug === slug ? "w-6 bg-emerald-300" : done.includes(c.slug) ? "w-2 bg-emerald-400/80" : "w-2 bg-white/15"
            }`}
          />
        ))}
        <span className="ml-1.5 text-[11px] font-bold text-slate-400">
          {done.length}/{CHALLENGES.length}
        </span>
      </div>

      <Link
        href={next ? challengeHref(next.slug) : "/finish"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 via-green-400 to-cyan-400 py-4 text-base font-extrabold text-slate-950 shadow-[0_8px_30px_rgba(34,197,94,0.4)] active:scale-[0.98]"
      >
        {next ? (
          <>
            შემდეგი: {next.number}. {next.title_ka}
            <ArrowRight className="h-4 w-4" strokeWidth={2.8} />
          </>
        ) : (
          <>
            <Flag className="h-4 w-4" strokeWidth={2.6} />
            ყველა გამოწვევა დასრულდა!
          </>
        )}
      </Link>

      <button
        type="button"
        onClick={onReplay}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 active:bg-white/10"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
        თავიდან გათამაშება
      </button>
    </div>
  );
}
