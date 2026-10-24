// app/finish/page.tsx
//
// After the last lesson: trophy, "How was it?" (saved to Supabase) and the share button.
// Reached early by hand, it shows how many are left and a way back.

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import FeedbackCard from "@/components/FeedbackCard";
import ShareButton from "@/components/ShareButton";
import { CHALLENGES } from "@/lib/challenges";
import { useT } from "@/lib/i18n";
import { useProgress } from "@/lib/player";

export default function FinishPage(): React.JSX.Element {
  const progress = useProgress();
  const { t } = useT();

  const finished = CHALLENGES.filter((c) => progress.includes(c.slug)).length;
  const allDone = finished === CHALLENGES.length;

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
        {allDone ? t("allDone") : t("progress", { done: finished, total: CHALLENGES.length })}
      </h1>

      {!allDone && (
        <Link href="/tree" className="mt-3 inline-block text-sm font-bold text-cyan-300 underline-offset-4 active:underline">
          {t("leftToPlay", { n: CHALLENGES.length - finished })}
        </Link>
      )}

      <div className="mt-8">
        <FeedbackCard />
      </div>

      <div className="mt-6">
        <ShareButton count={finished} />
      </div>

      <Link href="/tree" className="mt-4 inline-block py-2 text-sm font-bold text-slate-300">
        🌳 {t("treeTitle")}
      </Link>
    </div>
  );
}
