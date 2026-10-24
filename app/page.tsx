// app/page.tsx
//
// Home / sign-up: pick language, position and age (saved to Supabase). No name or email is collected.
// Players who already signed up on this device go straight to the knowledge tree.
// Background: app/assets/bg.png (9:16), full-bleed behind the page; the form sits on a dark fade at the bottom.

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import LangSwitch from "@/components/LangSwitch";
import { CHALLENGES } from "@/lib/challenges";
import { useT } from "@/lib/i18n";
import { AGES, POSITIONS, saveProfile, useHydrated, useProfile, type Position } from "@/lib/player";
import bg from "./assets/bg.png";
import logo from "./icon.png";

export default function Home(): React.JSX.Element {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();
  const { t } = useT();

  const [position, setPosition] = useState<Position | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Already signed up on this device: straight to the tree.
  useEffect(() => {
    if (profile) router.replace("/tree");
  }, [profile, router]);

  const ready = position !== null && age !== null;

  const start = (): void => {
    if (!position || age === null) return;
    setSaving(true);
    // Local save is instant; the database sync continues in the background after navigation.
    void saveProfile(position, age);
    router.push("/tree");
  };

  return (
    <div className="relative h-full overflow-hidden bg-slate-950">
      {/* 9:16 artwork fills the phone; anchored to the top so its upper part stays visible */}
      <Image
        src={bg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="(max-width: 480px) 100vw, 480px"
        className="pointer-events-none select-none object-cover object-top"
      />
      {/* Fade to dark at the bottom so the form is readable over any artwork */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/55 to-slate-950" />

      <div className="relative flex h-full flex-col overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex justify-end">
          <LangSwitch />
        </div>

        {/* Spacer: lets the artwork show above the form, shrinks on short screens */}
        <div className="min-h-[12vh] flex-1" />

        <div className="text-center">
          <h1>
            <span className="sr-only">SteadyBall</span>
            <Image src={logo} alt="" priority className="mx-auto h-20 w-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)]" />
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            {t("lessonsCount", { n: CHALLENGES.length })}
          </p>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-extrabold text-white">{t("askPosition")}</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {POSITIONS.map((p) => {
              const active = position === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPosition(p.value)}
                  aria-pressed={active}
                  className={`flex min-h-[48px] items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-sm font-bold backdrop-blur-md transition-colors ${
                    active ? "border-cyan-300/80 bg-cyan-400/25 text-cyan-50" : "border-white/15 bg-slate-950/55 text-slate-200"
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="min-w-0 leading-tight">{t(p.label)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-extrabold text-white">{t("askAge")}</h2>
          <div className="mt-2.5 grid grid-cols-5 gap-2">
            {AGES.map((a) => {
              const active = age === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  aria-pressed={active}
                  className={`min-h-[44px] rounded-xl border py-2.5 text-base font-black tabular-nums backdrop-blur-md transition-colors ${
                    active ? "border-cyan-300/80 bg-cyan-400/25 text-cyan-50" : "border-white/15 bg-slate-950/55 text-slate-200"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={start}
          disabled={!ready || saving || !hydrated || !!profile}
          className="mt-7 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 py-4 text-lg font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.35)] transition disabled:opacity-40"
        >
          {t("start")}
          <ArrowRight className="h-5 w-5" strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
}
