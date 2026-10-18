# SteadyBall Tactics

Mobile-only web app with five interactive football tactics puzzles.
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

## Structure

```
app/
  layout.tsx                    full-height page area (max 480px wide)
  page.tsx                      sign-up (position, age), then the first unfinished lesson
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
