// components/tree/KnowledgeTree.tsx
//
// The animated 2D knowledge tree. Each branch is a skill group; each leaf is one lesson.
// Finished leaves glow in the branch colour, the next suggested leaf pulses white.
// Tapping a branch (its leaves or its label) opens that branch's lessons.
//
// Drawing space: 360 × 500 units. The SVG and the HTML labels share it through a box that keeps
// that aspect ratio inside whatever room the page gives (container query units), so labels
// always sit on their branch. The box stands on the bottom edge, so the tree grows from the ground.

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { pick, useT } from "@/lib/i18n";
import { BRANCHES, lessonsOf, nextInBranch, type Branch } from "@/lib/tree";

const W = 360;
const H = 500;
const LEAF_GAP = 9.6; // phyllotaxis spacing
const GOLDEN = (137.508 * Math.PI) / 180;

interface Layout {
  /** Where the branch leaves the trunk. */
  base: { x: number; y: number };
  /** Bend of the branch (quadratic control point). */
  ctrl: { x: number; y: number };
  /** Centre of the leaf cluster. */
  tip: { x: number; y: number };
  /** Label anchor, whether the label hangs above or below it, and which of its edges sits on x. */
  label: { x: number; y: number; side: "above" | "below"; align: "left" | "center" | "right" };
  /** Idle sway in degrees and its period in seconds. */
  sway: number;
  period: number;
}

/* Roots → crown, matching BRANCHES order. */
const LAYOUT: Record<string, Layout> = {
  "get-open": {
    base: { x: 178, y: 420 },
    ctrl: { x: 118, y: 410 },
    tip: { x: 78, y: 352 },
    label: { x: 8, y: 404, side: "below", align: "left" },
    sway: 1.6,
    period: 5.2,
  },
  "under-pressure": {
    base: { x: 182, y: 398 },
    ctrl: { x: 248, y: 390 },
    tip: { x: 296, y: 350 },
    label: { x: 352, y: 378, side: "below", align: "right" },
    sway: 2.2,
    period: 4.4,
  },
  combinations: {
    base: { x: 178, y: 326 },
    ctrl: { x: 118, y: 300 },
    tip: { x: 82, y: 226 },
    label: { x: 8, y: 182, side: "above", align: "left" },
    sway: 1.4,
    period: 5.8,
  },
  "in-behind": {
    base: { x: 182, y: 308 },
    ctrl: { x: 248, y: 286 },
    tip: { x: 282, y: 222 },
    label: { x: 352, y: 184, side: "above", align: "right" },
    sway: 1.5,
    period: 5.0,
  },
  "create-space": {
    base: { x: 180, y: 268 },
    ctrl: { x: 172, y: 196 },
    tip: { x: 180, y: 116 },
    label: { x: 180, y: 52, side: "above", align: "center" },
    sway: 0.9,
    period: 6.4,
  },
};

const DEFAULT_LAYOUT = LAYOUT["create-space"];

/** Leaf i of n around the tip: sunflower spiral, easiest lesson in the middle. */
function leafAt(i: number, tip: { x: number; y: number }): { x: number; y: number; angle: number } {
  const r = LEAF_GAP * Math.sqrt(i + 0.6);
  const a = i * GOLDEN;
  return { x: tip.x + r * Math.cos(a), y: tip.y + r * Math.sin(a) * 0.92, angle: (a * 180) / Math.PI };
}

const clusterRadius = (n: number): number => LEAF_GAP * Math.sqrt(Math.max(n, 1) + 0.6) + 9;

const pct = (v: number, of: number): string => `${(v / of) * 100}%`;

export interface KnowledgeTreeProps {
  done: string[];
  /** Branch to highlight (the suggested next one). */
  suggested: string | null;
  onOpen: (branchId: string) => void;
}

export default function KnowledgeTree({ done, suggested, onOpen }: KnowledgeTreeProps): React.JSX.Element {
  const { lang } = useT();
  const still = useReducedMotion() ?? false;

  return (
    <div className="relative h-full w-full" style={{ containerType: "size" }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: `min(100cqw, calc(100cqh * ${W / H}))`,
          height: `min(100cqh, calc(100cqw * ${H / W}))`,
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="kt-trunk" x1="0" x2="1">
              <stop offset="0" stopColor="#5b3a22" />
              <stop offset="0.55" stopColor="#8a5a34" />
              <stop offset="1" stopColor="#4a2e1a" />
            </linearGradient>
            <radialGradient id="kt-hill" cx="0.5" cy="0" r="0.7">
              <stop offset="0" stopColor="#1f7a4a" />
              <stop offset="1" stopColor="#0b3b25" />
            </radialGradient>
            <radialGradient id="kt-halo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            {BRANCHES.map((b) => (
              <filter key={b.id} id={`kt-glow-${b.id}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* soft light behind the crown */}
          <ellipse cx={180} cy={220} rx={200} ry={210} fill="url(#kt-halo)" />

          {/* fireflies */}
          {!still &&
            FIREFLIES.map((f, i) => (
              <motion.circle
                key={i}
                cx={f.x}
                cy={f.y}
                r={f.r}
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0], y: [0, -f.drift, 0] }}
                transition={{ duration: f.d, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
              />
            ))}

          {/* ground: a little pitch-green hill with a centre line */}
          <path d={`M -20 ${H} Q 180 ${H - 60} 380 ${H} Z`} fill="url(#kt-hill)" />
          <path d={`M 40 ${H - 10} Q 180 ${H - 62} 320 ${H - 10}`} fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1.2} />

          {/* trunk */}
          <motion.path
            d="M 156 486 C 165 446 170 380 172 318 C 173 296 174 278 176 262 L 184 262 C 186 278 187 296 188 318 C 190 380 195 446 204 486 Z"
            fill="url(#kt-trunk)"
            style={{ transformOrigin: "180px 486px" }}
            initial={still ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          {/* roots */}
          <path d="M 160 482 Q 140 488 120 492 M 200 482 Q 222 488 242 492" stroke="#5b3a22" strokeWidth={4} strokeLinecap="round" fill="none" />

          {BRANCHES.map((b, bi) => (
            <BranchArt
              key={b.id}
              branch={b}
              index={bi}
              layout={LAYOUT[b.id] ?? DEFAULT_LAYOUT}
              done={done}
              highlighted={b.id === suggested}
              still={still}
            />
          ))}
        </svg>

        {/* Tap areas + labels (HTML, so text wraps and stays crisp in every language) */}
        {BRANCHES.map((b) => {
          const l = LAYOUT[b.id] ?? DEFAULT_LAYOUT;
          const list = lessonsOf(b.id);
          const n = list.length;
          const finished = list.filter((c) => done.includes(c.slug)).length;
          const r = clusterRadius(n);
          const highlighted = b.id === suggested;
          const complete = n > 0 && finished === n;
          return (
            <div key={b.id}>
              <button
                type="button"
                aria-label={`${pick(b.name, lang)} ${finished}/${n}`}
                onClick={() => onOpen(b.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: pct(l.tip.x, W), top: pct(l.tip.y, H), width: pct(r * 2, W), height: pct(r * 2, H) }}
              />
              <div
                className={`absolute max-w-[46%] ${l.label.side === "above" ? "-translate-y-full" : ""} ${
                  l.label.align === "center" ? "-translate-x-1/2" : l.label.align === "right" ? "-translate-x-full" : ""
                }`}
                style={{ left: pct(l.label.x, W), top: pct(l.label.y, H) }}
              >
                <motion.button
                  type="button"
                  onClick={() => onOpen(b.id)}
                  initial={still ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + BRANCHES.indexOf(b) * 0.08 }}
                  className={`flex min-h-[44px] items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-left backdrop-blur-md ${
                    highlighted ? "border-white/70 bg-slate-950/80" : "border-white/15 bg-slate-950/65"
                  }`}
                  style={{ boxShadow: highlighted ? `0 0 0 3px ${b.color}55, 0 0 24px ${b.color}66` : undefined }}
                >
                  <span className="text-base leading-none">{complete ? "🏆" : b.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-extrabold leading-tight text-white">{pick(b.name, lang)}</span>
                    <span className="block text-[11px] font-bold tabular-nums leading-tight" style={{ color: b.color }}>
                      {finished}/{n}
                    </span>
                  </span>
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BranchArt({
  branch,
  index,
  layout,
  done,
  highlighted,
  still,
}: {
  branch: Branch;
  index: number;
  layout: Layout;
  done: string[];
  highlighted: boolean;
  still: boolean;
}): React.JSX.Element {
  const { base, ctrl, tip } = layout;
  const list = lessonsOf(branch.id);
  const next = nextInBranch(branch.id, done);
  const d = `M ${base.x} ${base.y} Q ${ctrl.x} ${ctrl.y} ${tip.x} ${tip.y}`;
  const delay = 0.45 + index * 0.12;

  return (
    <motion.g
      style={{ transformOrigin: `${base.x}px ${base.y}px` }}
      animate={still ? undefined : { rotate: [0, layout.sway, 0, -layout.sway * 0.6, 0] }}
      transition={{ duration: layout.period, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
    >
      {/* the branch */}
      <motion.path
        d={d}
        fill="none"
        stroke="#7a4e2c"
        strokeWidth={index === BRANCHES.length - 1 ? 9 : 7}
        strokeLinecap="round"
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.55, ease: "easeOut" }}
      />

      {/* a faint ring around the suggested branch's leaves */}
      {highlighted && !still && (
        <motion.circle
          cx={tip.x}
          cy={tip.y}
          r={clusterRadius(list.length) - 2}
          fill="none"
          stroke={branch.color}
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.6, 0.15], scale: [0.97, 1.04, 0.97] }}
          style={{ transformOrigin: `${tip.x}px ${tip.y}px` }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* leaves: one per lesson */}
      {list.map((c, i) => {
        const p = leafAt(i, tip);
        const isDone = done.includes(c.slug);
        const isNext = next?.slug === c.slug;
        return (
          <motion.g
            key={c.slug}
            initial={still ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.35 + i * 0.025, type: "spring", stiffness: 420, damping: 18 }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          >
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={7.6}
              ry={5}
              transform={`rotate(${p.angle} ${p.x} ${p.y})`}
              fill={isDone ? branch.color : "#123526"}
              fillOpacity={1}
              stroke={isDone ? "#ffffff" : branch.color}
              strokeOpacity={isDone ? 0.6 : 0.75}
              strokeWidth={isDone ? 0.8 : 1.2}
              filter={isDone ? `url(#kt-glow-${branch.id})` : undefined}
            />
            {isNext && (
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={6.5}
                fill="#ffffff"
                animate={still ? undefined : { opacity: [0.35, 1, 0.35], scale: [0.85, 1.25, 0.85] }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.g>
        );
      })}
    </motion.g>
  );
}

/* Fixed (not random) so the server and the browser draw the same tree. */
const FIREFLIES = [
  { x: 40, y: 120, r: 1.6, d: 4.2, delay: 0.2, drift: 10 },
  { x: 320, y: 90, r: 1.3, d: 5.1, delay: 1.1, drift: 14 },
  { x: 120, y: 60, r: 1.1, d: 3.8, delay: 2.0, drift: 8 },
  { x: 250, y: 140, r: 1.5, d: 4.6, delay: 0.6, drift: 12 },
  { x: 30, y: 250, r: 1.2, d: 5.4, delay: 1.7, drift: 9 },
  { x: 335, y: 250, r: 1.6, d: 4.0, delay: 2.4, drift: 11 },
  { x: 140, y: 230, r: 1.0, d: 3.6, delay: 0.9, drift: 7 },
  { x: 225, y: 330, r: 1.3, d: 4.8, delay: 3.0, drift: 10 },
  { x: 95, y: 420, r: 1.1, d: 5.0, delay: 1.4, drift: 12 },
  { x: 270, y: 410, r: 1.4, d: 4.3, delay: 2.7, drift: 9 },
];
