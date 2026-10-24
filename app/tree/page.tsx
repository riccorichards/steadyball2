// app/tree/page.tsx
//
// The knowledge tree: overall progress + XP at the top, the animated tree in the middle,
// and one big "next challenge" button at the bottom. After 5 finished lessons it asks once
// "How was it?" (feedback for the dashboard), then offers sharing.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import FeedbackCard from "@/components/FeedbackCard";
import LangSwitch from "@/components/LangSwitch";
import KnowledgeTree from "@/components/tree/KnowledgeTree";
import { CHALLENGES, challengeHref } from "@/lib/challenges";
import { pick, useT } from "@/lib/i18n";
import { useHydrated, useProfile, useProgress, useRating, useXpMap } from "@/lib/player";
import { nextInBranch, suggestedBranch } from "@/lib/tree";

export default function TreePage(): React.JSX.Element {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();
  const done = useProgress();
  const xpMap = useXpMap();
  const rating = useRating();
  const { lang, t } = useT();

  // Not signed up on this device yet: sign-up first.
  useEffect(() => {
    if (hydrated && !profile) router.replace("/");
  }, [hydrated, profile, router]);

  const finished = CHALLENGES.filter((c) => done.includes(c.slug)).length;
  const total = CHALLENGES.length;
  const xp = useMemo(() => Object.values(xpMap).reduce((s, v) => s + v, 0), [xpMap]);
  const branch = suggestedBranch(done);
  const next = branch ? nextInBranch(branch.id, done) : null;
  const askFeedback = finished >= 5 && !rating;

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(120%_70%_at_50%_0%,#0b2a4a_0%,#020617_70%)] pt-[max(env(safe-area-inset-top),10px)]">
      {/* top: title, language, progress */}
      <header className="shrink-0 px-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-black tracking-tight">🌳 {t("treeTitle")}</h1>
          <LangSwitch />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400"
              initial={{ width: 0 }}
              animate={{ width: hydrated ? `${(finished / Math.max(total, 1)) * 100}%` : 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <span className="shrink-0 text-xs font-extrabold tabular-nums text-slate-200">
            {hydrated ? finished : 0}/{total}
          </span>
          <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-extrabold tabular-nums text-amber-300">
            ⚡ {hydrated ? xp : 0} {t("xp")}
          </span>
        </div>
      </header>

      {/* the tree, under a starry sky (the sky fills the extra height on tall phones) */}
      <div className="relative min-h-0 flex-1 px-2 py-1">
        <NightSky />
        {hydrated && (
          <KnowledgeTree done={done} suggested={branch?.id ?? null} onOpen={(id) => router.push(`/tree/${id}`)} />
        )}
      </div>

      {/* bottom: feedback once, else the next challenge */}
      <footer className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        {hydrated && askFeedback ? (
          <FeedbackCard compact />
        ) : hydrated && next ? (
          <button
            type="button"
            onClick={() => router.push(challengeHref(next.slug))}
            className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 px-4 py-3.5 text-left text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.35)] active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950/90">
              <Play className="h-5 w-5 translate-x-[1px] fill-white text-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider opacity-70">
                {branch ? `${branch.icon} ${pick(branch.name, lang)}` : t("playNext")}
              </span>
              <span className="block truncate text-base font-black">{pick(next.title, lang)}</span>
            </span>
          </button>
        ) : hydrated ? (
          <button
            type="button"
            onClick={() => router.push("/finish")}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-400 py-4 text-lg font-black text-slate-950"
          >
            🏆 {t("allDone")}
          </button>
        ) : (
          <div className="h-[68px]" />
        )}
      </footer>
    </div>
  );
}

/* Fixed positions (no randomness) so server and browser render the same sky. */
const STARS: [number, number, number][] = [
  [8, 6, 2], [18, 22, 1.5], [27, 9, 1], [36, 30, 2], [44, 14, 1.5], [55, 5, 1], [63, 24, 2], [71, 12, 1],
  [82, 28, 1.5], [91, 8, 2], [12, 40, 1], [50, 38, 1.5], [88, 44, 1], [5, 55, 1.5], [95, 60, 1], [30, 50, 1],
];

function NightSky(): React.JSX.Element {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map(([x, y, r], i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2 }}
          animate={{ opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 2.5 + (i % 5) * 0.6, repeat: Infinity, delay: (i % 7) * 0.4, ease: "easeInOut" }}
        />
      ))}
      {/* crescent moon: a transparent circle whose offset shadow is the moon */}
      <div
        className="absolute right-[8%] top-[4%] h-12 w-12 rounded-full"
        style={{ boxShadow: "-11px 7px 0 0 #fde68a", filter: "drop-shadow(0 0 14px rgba(253,230,138,0.55))" }}
      />
    </div>
  );
}
