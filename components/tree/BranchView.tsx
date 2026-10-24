// components/tree/BranchView.tsx
//
// The lessons of one branch as a vertical path: a node per lesson on a line that fills with the
// branch colour as the player climbs. Tap any lesson to play it.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Play } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { CHALLENGES, challengeHref } from "@/lib/challenges";
import { pick, useT, type StringKey } from "@/lib/i18n";
import { useHydrated, useProfile, useProgress, useXpMap } from "@/lib/player";
import { getBranch, lessonsOf, nextInBranch } from "@/lib/tree";

const LEVEL_LABEL: Record<string, StringKey> = {
  recognize: "levelRecognize",
  decide: "levelDecide",
  execute: "levelExecute",
  defend: "levelDefend",
  "game-speed": "levelGameSpeed",
};

export default function BranchView({ branchId }: { branchId: string }): React.JSX.Element | null {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();
  const done = useProgress();
  const xpMap = useXpMap();
  const { lang, t } = useT();

  useEffect(() => {
    if (hydrated && !profile) router.replace("/");
  }, [hydrated, profile, router]);

  const branch = getBranch(branchId);
  if (!branch) return null;
  const lessons = lessonsOf(branch.id);
  const next = hydrated ? nextInBranch(branch.id, done) : null;
  const finished = hydrated ? lessons.filter((c) => done.includes(c.slug)).length : 0;
  const complete = hydrated && lessons.length > 0 && finished === lessons.length;
  const allFinished = hydrated ? CHALLENGES.filter((c) => done.includes(c.slug)).length : 0;
  const ring = 2 * Math.PI * 20;

  return (
    <div
      className="flex h-full flex-col pt-[max(env(safe-area-inset-top),10px)]"
      style={{ background: `radial-gradient(120% 60% at 50% 0%, ${branch.color}33 0%, #020617 65%)` }}
    >
      <header className="shrink-0 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tree"
            aria-label={t("back")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-slate-950/60"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-black leading-tight">
              {branch.icon} {pick(branch.name, lang)}
            </h1>
            <p className="mt-0.5 text-xs leading-snug text-slate-300">{pick(branch.tagline, lang)}</p>
          </div>
          {/* progress ring */}
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#ffffff1f" strokeWidth="5" />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={branch.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ring}
                initial={{ strokeDashoffset: ring }}
                animate={{ strokeDashoffset: ring * (1 - finished / Math.max(lessons.length, 1)) }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums">
              {finished}/{lessons.length}
            </span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
        {complete && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="mb-4 rounded-3xl border border-amber-300/40 bg-amber-300/10 p-4 text-center"
          >
            <p className="text-4xl">🏆</p>
            <p className="mt-1 text-lg font-black">{t("branchDone")}</p>
            <div className="mt-3">
              <ShareButton count={allFinished} />
            </div>
          </motion.div>
        )}

        <ol className="relative">
          {lessons.map((c, i) => {
            const isDone = hydrated && done.includes(c.slug);
            const isNext = next?.slug === c.slug;
            const xp = xpMap[c.slug];
            const lineDone = isDone && i < lessons.length - 1;
            return (
              <motion.li
                key={c.slug}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + Math.min(i, 12) * 0.035 }}
                className="relative pb-3 pl-14"
              >
                {/* line to the next node */}
                {i < lessons.length - 1 && (
                  <span
                    className="absolute left-[21px] top-11 h-[calc(100%-32px)] w-1 rounded-full"
                    style={{ background: lineDone ? branch.color : "#ffffff1a" }}
                  />
                )}
                {/* node */}
                <span
                  className="absolute left-0 top-1 flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-black tabular-nums"
                  style={{
                    background: isDone ? branch.color : isNext ? "#ffffff" : "#0f172a",
                    borderColor: isDone ? "#ffffffaa" : isNext ? branch.color : "#ffffff26",
                    color: isDone || isNext ? "#020617" : "#94a3b8",
                    boxShadow: isDone ? `0 0 16px ${branch.color}88` : undefined,
                  }}
                >
                  {isDone ? <Check className="h-5 w-5" strokeWidth={3.4} /> : isNext ? <Play className="h-4 w-4 translate-x-[1px] fill-current" /> : i + 1}
                  {isNext && (
                    <motion.span
                      className="absolute inset-[-6px] rounded-full border-2"
                      style={{ borderColor: branch.color }}
                      animate={{ opacity: [0.8, 0, 0.8], scale: [0.9, 1.25, 0.9] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </span>
                {/* card */}
                <Link
                  href={challengeHref(c.slug)}
                  className={`block min-h-[52px] rounded-2xl border px-3.5 py-2.5 active:scale-[0.98] ${
                    isNext ? "border-white/40 bg-white/[0.09]" : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <span className={`block text-[15px] font-extrabold leading-snug ${isDone || isNext ? "text-white" : "text-slate-300"}`}>
                    {pick(c.title, lang)}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
                    {LEVEL_LABEL[c.level] && (
                      <span className="rounded-full px-2 py-0.5" style={{ background: `${branch.color}26`, color: branch.color }}>
                        {t(LEVEL_LABEL[c.level])}
                      </span>
                    )}
                    {isDone && xp ? <span className="tabular-nums text-amber-300">⚡ {xp} XP</span> : null}
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {next && (
        <footer className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-2">
          <Link
            href={challengeHref(next.slug)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black text-slate-950 active:scale-[0.98]"
            style={{ background: branch.color, boxShadow: `0 10px 35px ${branch.color}55` }}
          >
            <Play className="h-5 w-5 fill-current" />
            {finished === 0 ? t("start") : t("continue")}
          </Link>
        </footer>
      )}
    </div>
  );
}
