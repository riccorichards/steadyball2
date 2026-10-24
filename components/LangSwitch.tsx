// components/LangSwitch.tsx
//
// ქარ | ENG | РУС  — three small pills. The choice is saved on the device and on the player row.

"use client";

import { LANGS, setLang, useLang } from "@/lib/i18n";
import { syncLang } from "@/lib/player";

export default function LangSwitch({ className = "" }: { className?: string }): React.JSX.Element {
  const lang = useLang();
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={`inline-flex rounded-full border border-white/15 bg-slate-950/60 p-0.5 backdrop-blur-md ${className}`}
    >
      {LANGS.map((l) => {
        const active = l.value === lang;
        return (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={l.name}
            onClick={() => {
              if (active) return;
              setLang(l.value);
              void syncLang(l.value);
            }}
            className={`min-h-[36px] min-w-[48px] rounded-full px-3 text-[12px] font-extrabold tracking-wide transition-colors ${
              active ? "bg-white text-slate-950" : "text-slate-300"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
