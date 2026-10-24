// components/FeedbackCard.tsx
//
// "How was it?" — 🔥 / ⚽ / 😐. One answer per player (changing it updates the row).
// `compact` fits the bottom of the tree page; the full card is used on the finish page.

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { RATINGS, submitFeedback, useRating } from "@/lib/player";

export default function FeedbackCard({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const saved = useRating();
  const { t } = useT();

  return (
    <section className={`rounded-3xl border border-white/10 bg-white/[0.05] text-center backdrop-blur-md ${compact ? "p-3" : "p-5"}`}>
      <h2 className={`font-extrabold ${compact ? "text-base" : "text-lg"}`}>{t("howWasIt")}</h2>
      <div className={`grid grid-cols-3 gap-2 ${compact ? "mt-2" : "mt-4"}`}>
        {RATINGS.map((r) => {
          const active = saved === r.value;
          return (
            <motion.button
              key={r.value}
              type="button"
              onClick={() => void submitFeedback(r.value)}
              whileTap={{ scale: 0.93 }}
              aria-pressed={active}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl border px-1 transition-colors ${
                compact ? "py-2" : "py-4"
              } ${active ? "border-emerald-300/70 bg-emerald-400/15" : "border-white/10 bg-white/[0.04]"}`}
            >
              <span className={compact ? "text-2xl" : "text-3xl"}>{r.icon}</span>
              <span className={`text-[12px] font-bold ${active ? "text-emerald-100" : "text-slate-300"}`}>„{t(r.label)}“</span>
            </motion.button>
          );
        })}
      </div>
      {saved && !compact && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-300">
          <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t("thanks")}
        </p>
      )}
    </section>
  );
}
