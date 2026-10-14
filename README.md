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

## Structure

```
app/
  layout.tsx                    header + full-height page area (max 480px wide)
  page.tsx                      redirects to the first challenge
  challenges/<slug>/page.tsx    one route per challenge
components/
  AppHeader.tsx                 scrollable challenge chips; active chip follows the route
  challenges/*.tsx              the five puzzles (each one is self-contained)
lib/
  challenges.ts                 the list the header is built from (order, number, Georgian title)
```

| # | Route | Component |
|---|---|---|
| 1 | `/challenges/half-turn` | `HalfTurn.tsx` |
| 2 | `/challenges/triangle` | `PassingTriangle.tsx` |
| 3 | `/challenges/cut-back` | `CutBack.tsx` |
| 4 | `/challenges/curved-run` | `CurvedRun.tsx` |
| 5 | `/challenges/third-man` | `ThirdMan.tsx` |

## Adding a challenge

1. Put the component in `components/challenges/`. Its outer element should be `h-full w-full`:
   the layout gives it all the space under the header.
2. Create `app/challenges/<slug>/page.tsx` that renders it (copy any existing one).
3. Add an entry to `CHALLENGES` in `lib/challenges.ts`. The header picks it up automatically.

## Camera rule for puzzles with a zoomed pitch

Each zoomed puzzle defines the area that must always be visible (`VB`: banner space at the top down to
the lowest key player) and renders with `preserveAspectRatio="xMidYMin meet"`. That area fits on any
phone; spare space shows more pitch. Pointer math (`fitView`) must use the same `meet` scaling.
