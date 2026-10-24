// lib/i18n.ts
//
// App languages: Georgian, English, Russian. The choice lives on the device (localStorage) and is
// also saved on the player's row. First visit: the invite link's language (?l=ru), else the phone's
// language, else Georgian. Lesson texts carry their own ka / en / ru strings (see lessons/).

"use client";

import { useSyncExternalStore } from "react";

export type Lang = "ka" | "en" | "ru";

export const LANGS: { value: Lang; label: string; name: string }[] = [
  { value: "ka", label: "ქარ", name: "ქართული" },
  { value: "en", label: "ENG", name: "English" },
  { value: "ru", label: "РУС", name: "Русский" },
];

export const isLang = (v: unknown): v is Lang => v === "ka" || v === "en" || v === "ru";

const LANG_KEY = "sb.lang.v1";
const CHANGE_EVENT = "sb:lang";

function detect(): Lang {
  const list = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];
  for (const l of list) {
    const code = l.toLowerCase().slice(0, 2);
    if (code === "ka") return "ka";
    if (code === "ru" || code === "az" || code === "uk" || code === "be" || code === "kk" || code === "hy") return "ru";
    if (code === "en") return "en";
  }
  return "ka";
}

function stored(): Lang | null {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

export function getLang(): Lang {
  if (typeof window === "undefined") return "ka";
  return stored() ?? detect();
}

/** True once the player (or an invite link) has picked a language on this device. */
export const hasChosenLang = (): boolean => typeof window !== "undefined" && stored() !== null;

export function setLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode: keep it for this visit */
  }
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const subscribe = (cb: () => void): (() => void) => {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

export const useLang = (): Lang => useSyncExternalStore(subscribe, getLang, () => "ka");

/** Pick a string from a { ka, en, ru } record (falls back to English, then Georgian). */
export const pick = (text: Partial<Record<Lang, string>> | undefined, lang: Lang): string =>
  text?.[lang] ?? text?.en ?? text?.ka ?? "";

/* ---------------------------------------------------------------------------
 * UI strings
 * ------------------------------------------------------------------------- */

const STRINGS = {
  lessonsCount: { ka: "{n} ტაქტიკური გამოწვევა", en: "{n} tactical challenges", ru: "{n} тактических заданий" },
  askPosition: { ka: "რა პოზიციაზე თამაშობ?", en: "What position do you play?", ru: "На какой позиции играешь?" },
  askAge: { ka: "რამდენი წლის ხარ?", en: "How old are you?", ru: "Сколько тебе лет?" },
  start: { ka: "დაწყება", en: "Start", ru: "Начать" },
  continue: { ka: "გაგრძელება", en: "Continue", ru: "Продолжить" },
  posGK: { ka: "მეკარე", en: "Goalkeeper", ru: "Вратарь" },
  posDEF: { ka: "მცველი", en: "Defender", ru: "Защитник" },
  posMID: { ka: "ნახევარმცველი", en: "Midfielder", ru: "Полузащитник" },
  posATT: { ka: "თავდამსხმელი", en: "Forward", ru: "Нападающий" },

  treeTitle: { ka: "ცოდნის ხე", en: "Knowledge tree", ru: "Дерево знаний" },
  treeHint: { ka: "აირჩიე ტოტი", en: "Pick a branch", ru: "Выбери ветку" },
  done: { ka: "დასრულებული", en: "done", ru: "пройдено" },
  xp: { ka: "XP", en: "XP", ru: "XP" },
  back: { ka: "უკან", en: "Back", ru: "Назад" },
  play: { ka: "თამაში", en: "Play", ru: "Играть" },
  playNext: { ka: "შემდეგი გამოწვევა", en: "Next challenge", ru: "Следующее задание" },
  replay: { ka: "თავიდან", en: "Play again", ru: "Ещё раз" },
  branchDone: { ka: "ტოტი დასრულდა! 🌟", en: "Branch complete! 🌟", ru: "Ветка пройдена! 🌟" },
  allDone: { ka: "ყველა გამოწვევა დასრულდა!", en: "All challenges complete!", ru: "Все задания пройдены!" },
  progress: { ka: "დასრულებულია {done}/{total}", en: "{done}/{total} done", ru: "Пройдено {done}/{total}" },

  levelRecognize: { ka: "ამოიცანი", en: "Spot it", ru: "Найди" },
  levelDecide: { ka: "გადაწყვიტე", en: "Decide", ru: "Реши" },
  levelExecute: { ka: "შეასრულე", en: "Do it", ru: "Сделай" },
  levelGameSpeed: { ka: "მატჩის ტემპი", en: "Match speed", ru: "Темп матча" },
  levelDefend: { ka: "დაცვა", en: "Defend", ru: "Защита" },

  howWasIt: { ka: "როგორი იყო?", en: "How was it?", ru: "Как тебе?" },
  rateFire: { ka: "ცეცხლია", en: "Fire", ru: "Огонь" },
  rateGreat: { ka: "მაგარია", en: "Great", ru: "Круто" },
  rateOk: { ka: "ნორმალური", en: "Okay", ru: "Нормально" },
  thanks: { ka: "მადლობა!", en: "Thank you!", ru: "Спасибо!" },
  share: { ka: "გაუზიარე მეგობრებს", en: "Share with friends", ru: "Поделись с друзьями" },
  linkCopied: { ka: "ლინკი დაკოპირდა!", en: "Link copied!", ru: "Ссылка скопирована!" },
  copyLink: { ka: "დააკოპირე ლინკი:", en: "Copy the link:", ru: "Скопируй ссылку:" },
  shareText: {
    ka: "SteadyBall-ზე {n} ტაქტიკური გამოწვევა დავასრულე! ⚽ შენც სცადე:",
    en: "I finished {n} tactical challenges on SteadyBall! ⚽ Try it:",
    ru: "Я прошёл {n} тактических заданий в SteadyBall! ⚽ Попробуй и ты:",
  },
  leftToPlay: { ka: "დარჩა {n} → გაგრძელება", en: "{n} left → continue", ru: "Осталось {n} → продолжить" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function tr(key: StringKey, lang: Lang, vars?: Record<string, string | number>): string {
  let s: string = STRINGS[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

/** Hook: `const t = useT(); t("start")`. */
export function useT(): { lang: Lang; t: (key: StringKey, vars?: Record<string, string | number>) => string } {
  const lang = useLang();
  return { lang, t: (key, vars) => tr(key, lang, vars) };
}
