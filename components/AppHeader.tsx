"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CHALLENGES, challengeHref } from "@/lib/challenges";

/** Top navigation: one chip per challenge, horizontally scrollable, active chip kept in view. */
export default function AppHeader(): React.JSX.Element {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <header className="relative z-40 shrink-0 border-b border-white/10 bg-slate-950/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <nav
        aria-label="Challenges"
        className="flex items-center gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span className="mr-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-base shadow-[0_0_18px_rgba(34,211,238,0.35)]">
          ⚽
        </span>
        {CHALLENGES.map((c) => {
          const href = challengeHref(c.slug);
          const active = pathname === href;
          return (
            <Link
              key={c.slug}
              href={href}
              ref={active ? activeRef : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border py-1.5 pl-1.5 pr-3 text-[12.5px] font-bold transition-colors ${
                active
                  ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/[0.04] text-slate-400 active:bg-white/10"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                  active ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-slate-300"
                }`}
              >
                {c.number}
              </span>
              {c.title_ka}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
