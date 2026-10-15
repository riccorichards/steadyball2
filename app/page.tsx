// app/page.tsx  (REPLACE the existing file)
//
// Home / sign-up: pick position + age, saved to Supabase. No name or email is collected.
// Background: app/assets/bg.png (9:16), full-bleed behind the page; the form sits on a dark fade at the bottom.
// Logo: app/icon.png (the same file Next.js uses as the favicon).

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { challengeHref, CHALLENGES } from "@/lib/challenges";
import {
  AGES,
  POSITIONS,
  nextChallenge,
  saveProfile,
  useHydrated,
  useProfile,
  useProgress,
  type Position,
} from "@/lib/player";
import bg from "./assets/bg.png";
import logo from "./icon.png";

export default function Home(): React.JSX.Element {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();
  const progress = useProgress();

  const [position, setPosition] = useState<Position | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Returning player: pre-fill their answers.
  useEffect(() => {
    if (profile) {
      setPosition((p) => p ?? profile.position);
      setAge((a) => a ?? profile.age);
    }
  }, [profile]);

  const ready = position !== null && age !== null;
  const target = nextChallenge(progress) ?? CHALLENGES[0];

  const start = async (): Promise<void> => {
    if (!position || age === null) return;
    setSaving(true);
    // Local save is instant; the database sync continues in the background after navigation.
    void saveProfile(position, age);
    router.push(challengeHref(target.slug));
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

      <div className="relative flex h-full flex-col overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),16px)]">
        {/* Spacer: lets the artwork show above the form, shrinks on short screens */}
        <div className="min-h-[18vh] flex-1" />

        <div className="text-center">
          <h1>
            <span className="sr-only">SteadyBall</span>
            <Image
              src={logo}
              alt=""
              priority
              className="mx-auto h-20 w-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)]"
            />
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            {CHALLENGES.length} ტაქტიკური გამოწვევა
          </p>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-extrabold text-white">
            რა პოზიციაზე თამაშობ?
          </h2>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {POSITIONS.map((p) => {
              const active = position === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPosition(p.value)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-sm font-bold backdrop-blur-md transition-colors ${
                    active
                      ? "border-cyan-300/80 bg-cyan-400/25 text-cyan-50"
                      : "border-white/15 bg-slate-950/55 text-slate-200"
                  }`}
                >
                  <span className="text-xl">{p.icon}</span>
                  {p.label_ka}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-sm font-extrabold text-white">
            რამდენი წლის ხარ?
          </h2>
          <div className="mt-2.5 grid grid-cols-5 gap-2">
            {AGES.map((a) => {
              const active = age === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  aria-pressed={active}
                  className={`rounded-xl border py-2.5 text-base font-black tabular-nums backdrop-blur-md transition-colors ${
                    active
                      ? "border-cyan-300/80 bg-cyan-400/25 text-cyan-50"
                      : "border-white/15 bg-slate-950/55 text-slate-200"
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
          disabled={!ready || saving || !hydrated}
          className="mt-7 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 py-4 text-lg font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.35)] transition disabled:opacity-40"
        >
          {profile && progress.length > 0 ? "გაგრძელება" : "დაწყება"}
          <ArrowRight className="h-5 w-5" strokeWidth={2.8} />
        </button>

        {hydrated && progress.length > 0 && (
          <p className="mt-3 text-center text-xs text-slate-400">
            დასრულებულია {progress.length}/{CHALLENGES.length}
          </p>
        )}
      </div>
    </div>
  );
}
