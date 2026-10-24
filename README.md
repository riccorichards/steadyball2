# SteadyBall Tactics

Mobile-only web app: 69 interactive football tactics lessons on an animated knowledge tree, in Georgian, English and Russian.
Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · Framer Motion · Lucide.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

To try it on a phone, run `npm run dev -- -H 0.0.0.0` and open `http://<your-computer-ip>:3000`
on a phone connected to the same Wi-Fi.

Production build: `npm run build && npm start`.

## Lessons

Every challenge is a lesson file in `lessons/`, made in **Pitch Scenario Studio** (Export → `.lesson.json`).
One page, `/lesson/<id>`, plays any of them with the Studio's player (`@pss/player`, in `vendor/pss-player`).
No component per challenge.

**Add a lesson:** save the exported file as `lessons/NN-name.lesson.json` (NN sets the order) and run
`npm run dev` or `npm run build`. Both first run `npm run lessons`, which lists the files and stops with
a clear message if one is broken. The header, home page, progress and finish page pick it up automatically.

**Update the player:** in the Studio repo run `pnpm bundle:player ../steadyball2/vendor/pss-player`,
then `npm install` here.

## Languages (ka / en / ru)

- App texts: `lib/i18n.ts` (one table, all three languages). Switch: `components/LangSwitch.tsx` (home and tree).
- First visit: the invite link's language (`?l=ru`), else the phone's language, else Georgian.
- Lesson texts: every `{ ka, en }` in a lesson file also has `ru`. A new lesson exported without Russian
  shows English to Russian players (`lib/lessons.ts`), and `npm run lessons` lists which ones need Russian.
- The player's own buttons (Check, Try again, Next…) got Russian in `vendor/pss-player/index.js`.
  **When the player is rebuilt in the Studio, add the same 12 `ru` strings to the Studio's player UI table**,
  or they fall back to Georgian.

## Knowledge tree

`lib/tree.ts` hangs every lesson on a branch by its `meta.topic` (set in the Studio). Five branches,
roots → crown: Get open · Under pressure · Combinations · In behind · Create space. A new topic not listed
there lands on the last branch. Pages: `/tree` (the animated tree) and `/tree/<branch>` (its lessons).
"Next" in a lesson goes to the next unfinished lesson of the same branch.

## Invite links and the dashboard

- Create links in `/admin` → **Invite links** (name, code, kind, language). Share `https://<site>/i/<code>`.
- The first link a device arrives with is saved with the player (`players.invite_code`); the dashboard
  shows players, active, came back and lessons per link. The in-app share button uses `/i/share`.
- Also recorded (no names, no emails): language, country (from Vercel's edge header, no IP stored),
  XP / attempts / time per finished lesson, every Check press (`lesson_attempts`), active days (`player_days`).

**Database setup for this version (once):** in Supabase → SQL Editor run
`supabase/002_invites_progress.sql`, then `supabase/admin.sql`.

## Structure

```
app/
  layout.tsx                    full-height page area (max 480px wide)
  page.tsx                      sign-up (language, position, age), then the tree
  tree/page.tsx                 the knowledge tree
  tree/[branch]/page.tsx        one branch: its lessons as a path
  i/[code]/route.ts             invite links → /?i=<code>&l=<lang>
  api/geo/route.ts              visitor's country code (Vercel header)
  lesson/[id]/page.tsx          plays any lesson from lessons/
  challenges/<slug>/page.tsx    the five hand-built pilot pages, kept for comparison (not in the list)
  finish/page.tsx               after the last lesson: rating + share
components/
  LessonScreen.tsx              the player, wired to progress (lib/player.ts)
  AppHeader.tsx                 challenge chips (currently hidden in the layout)
  challenges/*.tsx              the five pilot puzzles
lib/
  lessons.ts                    reads and checks lessons/
  challenges.ts                 the list built from the lessons (order, number, Georgian title)
  player.ts                     profile, progress, feedback (local first, Supabase sync)
lessons/                        *.lesson.json + generated index.ts
vendor/pss-player/              the bundled Studio player (do not edit; rebuild it in the Studio repo)
```

## Camera rule for puzzles with a zoomed pitch

Each zoomed puzzle defines the area that must always be visible (`VB`: banner space at the top down to
the lowest key player) and renders with `preserveAspectRatio="xMidYMin meet"`. That area fits on any
phone; spare space shows more pitch. Pointer math (`fitView`) must use the same `meet` scaling.
