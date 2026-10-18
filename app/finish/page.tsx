// app/finish/page.tsx  (NEW FILE)
//
// Shown after all five challenges: "როგორი იყო?" rating (saved to Supabase) + Web Share.

"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Share2, Trophy } from "lucide-react";
import { CHALLENGES, challengeHref } from "@/lib/challenges";
import { RATINGS, submitFeedback, useProgress, useRating, type Rating } from "@/lib/player";

const SHARE_TEXT = `SteadyBall-ზე ${CHALLENGES.length} ტაქტიკური გამოწვევა დავასრულე! ⚽ შენც სცადე:`;

export default function FinishPage(): React.JSX.Element {
  const progress = useProgress();
  const savedRating = useRating();
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const allDone = CHALLENGES.every((c) => progress.includes(c.slug));
  const remaining = CHALLENGES.filter((c) => !progress.includes(c.slug));

  const rate = (r: Rating): void => {
    void submitFeedback(r);
  };

  const share = async (): Promise<void> => {
    const url = window.location.origin;
    const data = { title: "SteadyBall", text: SHARE_TEXT, url };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // user closed the share sheet
      }
    }
    // Fallback (desktop, or share not supported): copy the link.
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2500);
    } catch {
      window.prompt("დააკოპირე ლინკი:", url);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-8 text-center">
      <motion.div
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_50px_rgba(250,204,21,0.5)]"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14 }}
      >
        <Trophy className="h-12 w-12 text-slate-900" strokeWidth={2.2} />
      </motion.div>

      <h1 className="mt-5 text-2xl font-black">
        {allDone ? "ყველა გამოწვევა დასრულდა!" : `დასრულებულია ${progress.length}/${CHALLENGES.length}`}
      </h1>

      {!allDone && remaining[0] && (
        <Link href={challengeHref(remaining[0].slug)} className="mt-3 inline-block text-sm font-bold text-cyan-300 underline-offset-4 active:underline">
          დარჩა: {remaining.map((c) => c.number).join(", ")} → გაგრძელება
        </Link>
      )}

      {/* "როგორი იყო?" */}
      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-lg font-extrabold">როგორი იყო?</h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {RATINGS.map((r) => {
            const active = savedRating === r.value;
            return (
              <motion.button
                key={r.value}
                type="button"
                onClick={() => rate(r.value)}
                whileTap={{ scale: 0.93 }}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-4 transition-colors ${
                  active ? "border-emerald-300/70 bg-emerald-400/15" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="text-3xl">{r.icon}</span>
                <span className={`text-[12px] font-bold ${active ? "text-emerald-100" : "text-slate-300"}`}>„{r.label_ka}“</span>
              </motion.button>
            );
          })}
        </div>
        {savedRating && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> მადლობა!
          </p>
        )}
      </section>

      {/* Web Share */}
      <button
        type="button"
        onClick={share}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 py-4 text-lg font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.35)] active:scale-[0.98]"
      >
        <Share2 className="h-5 w-5" strokeWidth={2.6} />
        {shareState === "copied" ? "ლინკი დაკოპირდა!" : "გაუზიარე მეგობრებს"}
      </button>
    </div>
  );
}
