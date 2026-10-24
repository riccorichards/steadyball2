// components/AppBoot.tsx
//
// Runs once per page load, renders nothing:
//  - remembers the invite code from ?i=… (first link wins) and the language from ?l=…,
//    then removes both from the address bar so a shared link doesn't carry them on;
//  - keeps <html lang> in step with the chosen language;
//  - marks the player active today (for the "came back" numbers in the dashboard).

"use client";

import { useEffect } from "react";
import { getLang, hasChosenLang, isLang, setLang } from "@/lib/i18n";
import { captureInvite, touchToday } from "@/lib/player";

export default function AppBoot(): null {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("i");
    const lang = url.searchParams.get("l");
    if (code) captureInvite(code);
    if (isLang(lang) && !hasChosenLang()) setLang(lang);
    if (code || lang) {
      url.searchParams.delete("i");
      url.searchParams.delete("l");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    document.documentElement.lang = getLang();
    void touchToday();
  }, []);
  return null;
}
