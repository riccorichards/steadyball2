// components/ShareButton.tsx
//
// Web Share (phone share sheet), with a copy-the-link fallback.
// The shared link is /i/share, so players who arrive through a friend are counted under
// "Shared by players" in the dashboard.

"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function ShareButton({ count }: { count: number }): React.JSX.Element {
  const { lang, t } = useT();
  const [copied, setCopied] = useState(false);

  const share = async (): Promise<void> => {
    const url = `${window.location.origin}/i/share?l=${lang}`;
    const text = t("shareText", { n: count });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "SteadyBall", text, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t("copyLink"), url);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 py-4 text-lg font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.35)] active:scale-[0.98]"
    >
      <Share2 className="h-5 w-5" strokeWidth={2.6} />
      {copied ? t("linkCopied") : t("share")}
    </button>
  );
}
