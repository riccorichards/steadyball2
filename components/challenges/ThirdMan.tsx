"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useAnimationControls } from "framer-motion";
import { Ban, RotateCcw, Sparkles, Target, Trophy, Volume2, VolumeX } from "lucide-react";

/* ============================================================================
 * 1. LESSON DATA
 * ========================================================================== */

interface Vec2 {
  x: number;
  y: number;
}

type Side = "team" | "opponent";

interface PitchPlayer {
  id: string;
  /** Text inside the disc: a shirt number, or "GK". */
  label: string;
  side: Side;
  position: Vec2;
  /** Intro animation: where the player starts before moving to `position`. */
  intro_from?: Vec2;
  /** Role letter in the A ➔ B ➔ C combination. */
  role?: "A" | "B" | "C";
}

interface Zone {
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
}

interface Lesson {
  lesson_id: string;
  meta: { target_age_bracket: string; puzzle_elo_rating: number };
  context: {
    title_ka: string;
    banner_title_ka: string;
    banner_text_ka: string;
    intro_text_ka: string;
    step1_ka: string;
    step2_ka: string;
    goal_pop_ka: string;
  };
  a_id: string;
  b_id: string;
  c_id: string;
  blocker_id: string;
  players: PitchPlayer[];
  camera: { min_x: number; width: number; top: number };
  /** C's run: lane point (where he waits), where the layoff meets him, and where he shoots. */
  c_run: { lane: Vec2; receive: Vec2; shot_from: Vec2 };
  /** Where #6 steps once the ball goes to B (drawn to the ball, back to C). */
  blocker_step_to_b: Vec2;
  zone14: Zone;
  shot_target: Vec2;
  feedback: { success_title_ka: string; success_text_ka: string; intercepted_ka: string };
  rewards: { elo: number; badge: string; stats: Record<string, string> };
}

const LESSON: Lesson = {
  lesson_id: "SB_TASK_403_001",
  meta: { target_age_bracket: "U12_U14", puzzle_elo_rating: 1400 },
  context: {
    title_ka: "მესამე კაცის პრინციპი",
    banner_title_ka: "პირდაპირი ხაზი ჩაკეტილია! 🚫",
    banner_text_ka:
      "გამოიყენე მესამე კაცი (A ➔ B ➔ C): მიეცი პასი B-ს (#9), რათა მან ერთი შეხებით გაიყვანოს C (#8) ცარიელ სივრცეში!",
    intro_text_ka: "უყურე სიტუაციას…",
    step1_ka: "შეეხე მოთამაშეს ან გადაათრიე ბურთი #4-დან, რომ პასი მისცე.",
    step2_ka: "ბურთი B-სთანაა! ახლა შეეხე C-ს (#8) — B ერთი შეხებით გადასცემს.",
    goal_pop_ka: "გოოოლ!",
  },
  a_id: "team_4",
  b_id: "team_9",
  c_id: "team_8",
  blocker_id: "opp_6",
  players: [
    { id: "team_4", label: "4", side: "team", role: "A", position: { x: 44, y: 35 } },
    { id: "team_9", label: "9", side: "team", role: "B", position: { x: 60, y: 50 }, intro_from: { x: 61, y: 64 } },
    { id: "team_8", label: "8", side: "team", role: "C", position: { x: 49, y: 58 }, intro_from: { x: 55, y: 47 } },
    { id: "opp_6", label: "6", side: "opponent", position: { x: 47.3, y: 50 }, intro_from: { x: 51, y: 54 } },
    { id: "opp_5", label: "5", side: "opponent", position: { x: 43, y: 86.5 } },
    { id: "opp_gk", label: "GK", side: "opponent", position: { x: 52, y: 98 } },
  ],
  camera: { min_x: 12, width: 76, top: -6 },
  c_run: { lane: { x: 51.5, y: 67.5 }, receive: { x: 53, y: 72 }, shot_from: { x: 53.5, y: 81 } },
  blocker_step_to_b: { x: 50, y: 51 },
  zone14: { min_x: 33.3, max_x: 66.7, min_y: 66.7, max_y: 83.3 },
  shot_target: { x: 45.6, y: 101.6 },
  feedback: {
    success_title_ka: "გვარდიოლას საიდუმლო იარაღი: მესამე კაცი! 📐⚡",
    success_text_ka:
      "A ვერ აძლევს C-ს, ამიტომ აძლევს B-ს, რომელიც C-ს თავისუფალ სივრცეში უშვებს! ეს არის მსოფლიო ფეხბურთში ყველაზე შეუჩერებელი კომბინაცია!",
    intercepted_ka: "ჩაჭრილია! ❌ მცველი ხაზს კეტავს! იპოვე მესამე კაცი (B)!",
  },
  rewards: { elo: 30, badge: "Master Level!", stats: { DEC: "+3", POS: "+3", SCN: "+2" } },
};

/* ============================================================================
 * 2. GEOMETRY
 *    Pitch: X 0 = left, 100 = right · Y 0 = own goal (bottom), 100 = opponent goal (top)
 *    SVG  : svgY = (100 - y) * 1.5, so the pitch has real 68 × 105 proportions
 * ========================================================================== */

const PITCH_W = 100;
const PITCH_H = 150;
const Y_SCALE = PITCH_H / 100;
const PLAYER_R = 3.4;
const BALL_OFFSET = PLAYER_R + 1.3;
const INTRO_MS = 1500;
const PITCH_WIDTH_M = 68;
const PITCH_LENGTH_M = 105;
const PASS_AB_MS = 650;
const INTERCEPT_MS = 1500;
const FINISH_MS = 1500;
const GOAL_HOLD_MS = 1500;

/**
 * Camera: the area that must always be on screen (banner space at the top down to the lowest key player).
 * "xMidYMin meet" fits it on any phone; spare screen space shows more pitch below or at the sides.
 */
const VB = { x: LESSON.camera.min_x, y: LESSON.camera.top, w: LESSON.camera.width, h: 110 };

interface Fit {
  scale: number;
  offX: number;
  offY: number;
}

const fitView = (w: number, h: number): Fit => {
  const scale = Math.min(w / VB.w, h / VB.h);
  return { scale, offX: (w - VB.w * scale) / 2, offY: 0 };
};

const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const toSvg = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_W, y: (100 - p.y) * Y_SCALE });

const toMetres = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_WIDTH_M, y: (p.y / 100) * PITCH_LENGTH_M });

/** Closest point on segment a→b to p (pitch coords, measured in metres). */
const closestOnSegment = (p: Vec2, a: Vec2, b: Vec2): Vec2 => {
  const P = toMetres(p);
  const A = toMetres(a);
  const B = toMetres(b);
  const vx = B.x - A.x;
  const vy = B.y - A.y;
  const lenSq = vx * vx + vy * vy || 1;
  const t = Math.min(1, Math.max(0, ((P.x - A.x) * vx + (P.y - A.y) * vy) / lenSq));
  return lerp(a, b, t);
};

/** Bearing in pitch metres. 0° = toward opponent goal, 90° = right. */
const bearingDeg = (from: Vec2, to: Vec2): number => {
  const a = toMetres(from);
  const b = toMetres(to);
  const deg = (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
};

/** Point `dist` SVG units away from origin in a bearing direction. */
const offsetAlong = (origin: Vec2, angleDeg: number, dist: number): Vec2 => {
  const r = (angleDeg * Math.PI) / 180;
  return { x: origin.x + Math.sin(r) * dist, y: origin.y - Math.cos(r) * dist };
};

/** SVG point where a pass from `from` to `to` should arrive (at the receiver's feet). */
const feet = (player: Vec2, from: Vec2): Vec2 => offsetAlong(toSvg(player), bearingDeg(player, from), BALL_OFFSET);

/* ============================================================================
 * 3. HOOKS & AUDIO
 * ========================================================================== */

const useElementSize = (ref: React.RefObject<HTMLElement | null>): { w: number; h: number } => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
};

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

const createAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  return Ctor ? new Ctor() : null;
};

const noiseBuffer = (ctx: AudioContext, seconds: number): AudioBuffer => {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
};

const playCheer = (ctx: AudioContext): void => {
  const duration = 2.8;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(700, t);
  band.frequency.linearRampToValueAtTime(1150, t + 0.5);
  band.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.38, t + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(band).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + duration);
};

/** Grass-scraping slide plus a dull thud as the ball is blocked. */
const playSlideTackle = (ctx: AudioContext): void => {
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.5);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, t);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.45);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.5);

  const thud = ctx.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(140, t + 0.32);
  thud.frequency.exponentialRampToValueAtTime(50, t + 0.5);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0.0001, t + 0.32);
  tg.gain.exponentialRampToValueAtTime(0.5, t + 0.34);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  thud.connect(tg).connect(ctx.destination);
  thud.start(t + 0.32);
  thud.stop(t + 0.56);
};

/** Short ball-strike tick for each pass. */
const playKick = (ctx: AudioContext): void => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(260, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.11);
};

/* ============================================================================
 * 4. SVG PIECES
 * ========================================================================== */

const PitchMarkings: React.FC = () => {
  const line = { stroke: "rgba(255,255,255,0.85)", strokeWidth: 0.4, fill: "none" } as const;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={-60} y={-80} width={220} height={320} fill="#0b2414" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          key={i}
          x={0}
          y={i * (PITCH_H / 10)}
          width={PITCH_W}
          height={PITCH_H / 10}
          fill={i % 2 === 0 ? "#13381e" : "#103219"}
        />
      ))}
      <rect x={0} y={0} width={PITCH_W} height={PITCH_H} {...line} />
      <line x1={0} y1={PITCH_H / 2} x2={PITCH_W} y2={PITCH_H / 2} {...line} />
      <circle cx={50} cy={PITCH_H / 2} r={13.3} {...line} />
      <circle cx={50} cy={PITCH_H / 2} r={0.6} fill="rgba(255,255,255,0.9)" />
      <rect x={20.35} y={0} width={59.3} height={23.6} {...line} />
      <rect x={36.55} y={0} width={26.9} height={7.9} {...line} />
      <circle cx={50} cy={15.7} r={0.55} fill="rgba(255,255,255,0.95)" />
      <path d="M 39.3 23.6 A 13.3 13.3 0 0 0 60.7 23.6" {...line} />
    </g>
  );
};

/** Goal frame with a net that ripples when the ball hits it. */
const GoalNet: React.FC<{ rippling: boolean }> = ({ rippling }) => {
  const x0 = 44.6;
  const x1 = 55.4;
  const depth = 2.9;
  const verticals = Array.from({ length: 12 }, (_, i) => x0 + ((x1 - x0) / 11) * i);
  const horizontals = Array.from({ length: 4 }, (_, i) => -((depth / 4) * (i + 1)));
  return (
    <motion.g
      style={{ pointerEvents: "none", transformBox: "fill-box", transformOrigin: "50% 100%" }}
      animate={
        rippling
          ? { scaleY: [1, 1.5, 0.85, 1.18, 0.95, 1], skewX: [0, 5, -4, 2, -1, 0] }
          : { scaleY: 1, skewX: 0 }
      }
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      <rect x={x0} y={-depth} width={x1 - x0} height={depth} fill="rgba(255,255,255,0.06)" />
      {verticals.map((x) => (
        <line key={`v${x}`} x1={x} y1={-depth} x2={x} y2={0} stroke="rgba(255,255,255,0.28)" strokeWidth={0.12} />
      ))}
      {horizontals.map((y) => (
        <line key={`h${y}`} x1={x0} y1={y} x2={x1} y2={y} stroke="rgba(255,255,255,0.28)" strokeWidth={0.12} />
      ))}
      <path d={`M ${x0} 0 L ${x0} ${-depth} L ${x1} ${-depth} L ${x1} 0`} fill="none" stroke="#ffffff" strokeWidth={0.55} />
    </motion.g>
  );
};

interface TokenProps {
  label: string;
  side: Side;
  angle: number;
  role?: string;
  halo?: boolean;
}

/** A player disc: bold number inside, a small role badge (A/B/C) on the shoulder. */
const PlayerToken: React.FC<TokenProps> = ({ label, side, angle, role, halo = false }) => {
  const fill = side === "team" ? "#06b6d4" : "#be123c";
  const stroke = side === "team" ? "#083344" : "#4c0519";
  const pointer = side === "team" ? "#a5f3fc" : "#fda4af";
  return (
    <g style={{ pointerEvents: "none" }}>
      <ellipse cx={0} cy={PLAYER_R * 0.95} rx={PLAYER_R * 0.9} ry={0.9} fill="rgba(0,0,0,0.35)" />
      {halo && (
        <>
          <motion.circle
            r={PLAYER_R + 1.6}
            fill="#22d3ee"
            animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.35, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <circle r={PLAYER_R + 1.2} fill="none" stroke="#67e8f9" strokeWidth={0.4} filter="url(#glow)" />
        </>
      )}
      <g transform={`rotate(${angle})`}>
        <polygon points={`0,${-PLAYER_R - 1.7} -1.1,${-PLAYER_R - 0.15} 1.1,${-PLAYER_R - 0.15}`} fill={pointer} />
      </g>
      <circle r={PLAYER_R} fill={fill} stroke={stroke} strokeWidth={0.6} />
      <text
        y={label.length > 1 ? 1.0 : 1.15}
        textAnchor="middle"
        fontSize={label.length > 1 ? 2.8 : 3.3}
        fontWeight={900}
        fill="#ffffff"
        fontFamily="ui-sans-serif, system-ui"
      >
        {label}
      </text>
      {role && (
        <g transform={`translate(${PLAYER_R * 0.85} ${-PLAYER_R * 0.85})`}>
          <circle r={1.55} fill="#facc15" stroke="#422006" strokeWidth={0.3} />
          <text y={0.6} textAnchor="middle" fontSize={1.8} fontWeight={900} fill="#1c1917" fontFamily="ui-sans-serif, system-ui">
            {role}
          </text>
        </g>
      )}
    </g>
  );
};

const Ball: React.FC = () => (
  <g>
    <ellipse cx={0.25} cy={1.15} rx={1.25} ry={0.45} fill="rgba(0,0,0,0.4)" />
    <circle r={1.3} fill="#ffffff" stroke="#0f172a" strokeWidth={0.25} />
    <polygon points="0,-0.55 0.52,-0.17 0.32,0.45 -0.32,0.45 -0.52,-0.17" fill="#0f172a" />
  </g>
);

/** Glowing green pass arrow that draws itself. */
const PassArrow: React.FC<{ from: Vec2; to: Vec2; delay?: number }> = ({ from, to, delay = 0 }) => {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const tip = { x: to.x - Math.cos(ang) * (PLAYER_R + 0.6), y: to.y - Math.sin(ang) * (PLAYER_R + 0.6) };
  const start = { x: from.x + Math.cos(ang) * (PLAYER_R + 0.6), y: from.y + Math.sin(ang) * (PLAYER_R + 0.6) };
  const head = 1.8;
  const left = { x: tip.x - Math.cos(ang - 0.45) * head, y: tip.y - Math.sin(ang - 0.45) * head };
  const right = { x: tip.x - Math.cos(ang + 0.45) * head, y: tip.y - Math.sin(ang + 0.45) * head };
  return (
    <g style={{ pointerEvents: "none" }} filter="url(#neon)">
      <motion.line
        x1={start.x}
        y1={start.y}
        x2={tip.x}
        y2={tip.y}
        stroke="#22c55e"
        strokeWidth={0.7}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay }}
      />
      <motion.polygon
        points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
        fill="#22c55e"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4 }}
      />
    </g>
  );
};

/* ============================================================================
 * 5. VICTORY MODAL
 * ========================================================================== */

const STAT_LABELS_KA: Record<string, string> = {
  DEC: "გადაწყვეტილება",
  POS: "პოზიციონირება",
  SCN: "სკანირება",
};

interface VictoryModalProps {
  title: string;
  text: string;
  elo: number;
  badge: string;
  stats: Record<string, string>;
  soundOn: boolean;
  onToggleSound: () => void;
  onReplay: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ title, text, elo, badge, stats, soundOn, onToggleSound, onReplay }) => {
  const [eloDisplay, setEloDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, elo, {
      duration: 1.2,
      delay: 0.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setEloDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [elo]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {Array.from({ length: 26 }, (_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute top-0 h-2.5 w-1.5 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: ["#a855f7", "#22d3ee", "#facc15", "#22c55e", "#ffffff"][i % 5],
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: 900, rotate: 360 + i * 40, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 7) * 0.08, ease: "easeIn" }}
        />
      ))}

      <motion.div
        className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-6 shadow-[0_0_60px_rgba(168,85,247,0.3)]"
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl" />

        <button
          type="button"
          onClick={onToggleSound}
          aria-label="sound"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <motion.div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            initial={{ rotate: -25, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
          >
            <Trophy className="h-12 w-12 text-white" strokeWidth={2.2} />
          </motion.div>
          <motion.div
            className="absolute -right-1 -top-1"
            animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            <Sparkles className="h-6 w-6 text-cyan-300" />
          </motion.div>
        </div>

        <h2 className="text-center text-xl font-extrabold leading-tight text-white">{title}</h2>

        <div className="mt-4 flex flex-col items-center gap-1.5">
          <motion.div
            className="w-fit rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 font-mono text-2xl font-black text-emerald-300"
            initial={{ scale: 0.6 }}
            animate={{ scale: [0.6, 1.15, 1] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            +{eloDisplay} ELO
          </motion.div>
          <motion.span
            className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-white"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            {badge}
          </motion.span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {Object.entries(stats).map(([key, value], i) => (
            <motion.div
              key={key}
              className="rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-400/15 to-transparent px-1.5 py-2.5 text-center"
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.7 + i * 0.15 }}
            >
              <div className="text-lg font-black text-cyan-300">{value}</div>
              <div className="text-xs font-extrabold tracking-wider text-white">{key}</div>
              <div className="mt-0.5 text-[9px] leading-tight text-slate-400">{STAT_LABELS_KA[key] ?? key}</div>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-slate-300">{text}</p>

        <motion.button
          type="button"
          onClick={onReplay}
          whileTap={{ scale: 0.97 }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 py-4 text-base font-extrabold text-slate-950 shadow-[0_8px_30px_rgba(168,85,247,0.4)]"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.6} />
          თავიდან გათამაშება (Replay)
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

/* ============================================================================
 * 6. MAIN PAGE
 * ========================================================================== */

type Phase = "intro" | "pick1" | "intercept" | "toB" | "pick2" | "toC" | "goal" | "success";

export default function ThirdManPage(): React.JSX.Element {
  const lesson = LESSON;
  const byId = (id: string): PitchPlayer => {
    const p = lesson.players.find((pl) => pl.id === id);
    if (!p) throw new Error(`Unknown player ${id}`);
    return p;
  };
  const A = byId(lesson.a_id);
  const B = byId(lesson.b_id);
  const C = byId(lesson.c_id);
  const blocker = byId(lesson.blocker_id);

  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [failId, setFailId] = useState(0);
  const [failVisible, setFailVisible] = useState(false);
  const [aim, setAim] = useState<Vec2 | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const pitchRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const timeouts = useRef<number[]>([]);
  const shake = useAnimationControls();
  const size = useElementSize(pitchRef);

  const later = (fn: () => void, ms: number): void => {
    timeouts.current.push(window.setTimeout(fn, ms));
  };

  /* ---------- Phase timeline ---------- */
  useEffect(() => {
    const t = window.setTimeout(() => setPhase("pick1"), INTRO_MS);
    timeouts.current.push(t);
    return () => window.clearTimeout(t);
  }, [runId]);

  useEffect(() => {
    const list = timeouts.current;
    return () => {
      list.forEach((t) => window.clearTimeout(t));
      audioRef.current?.close().catch(() => undefined);
    };
  }, []);

  /* ---------- Audio helpers ---------- */
  const ensureAudio = (): void => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    if (audioRef.current?.state === "suspended") audioRef.current.resume().catch(() => undefined);
  };
  const sfx = (fn: (ctx: AudioContext) => void): void => {
    if (soundOn && audioRef.current) fn(audioRef.current);
  };
  const vibrate = (pattern: number | number[]): void => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  };

  /* ---------- Passing ---------- */
  const holderId = phase === "pick2" ? B.id : A.id;
  const canPass = phase === "pick1" || phase === "pick2";

  const passTo = (targetId: string): void => {
    if (!canPass || targetId === holderId) return;
    ensureAudio();
    setAim(null);
    sfx(playKick);

    if (phase === "pick1" && targetId === C.id) {
      setPhase("intercept");
      setFailVisible(false);
      later(() => {
        sfx(playSlideTackle);
        vibrate([70, 40, 70]);
      }, 120);
      later(() => {
        setFailId((n) => n + 1);
        setFailVisible(true);
        shake.start({ x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.5 } });
      }, 520);
      later(() => setPhase("pick1"), INTERCEPT_MS);
      return;
    }

    if (phase === "pick1" && targetId === B.id) {
      setFailVisible(false);
      setPhase("toB");
      later(() => setPhase("pick2"), PASS_AB_MS);
      return;
    }

    if (phase === "pick2" && targetId === C.id) {
      setPhase("toC");
      later(() => {
        setPhase("goal");
        vibrate([80, 40, 140]);
        sfx(playCheer);
      }, FINISH_MS);
      later(() => setPhase("success"), FINISH_MS + GOAL_HOLD_MS);
    }
  };

  /* Drag-to-pass: press on the ball carrier, release on a teammate. */
  const getSvgPoint = useCallback((clientX: number, clientY: number): Vec2 | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const f = fitView(rect.width, rect.height);
    if (!f.scale) return null;
    return {
      x: (clientX - rect.left - f.offX) / f.scale + VB.x,
      y: (clientY - rect.top - f.offY) / f.scale + VB.y,
    };
  }, []);

  const teammateSvgPos = (id: string): Vec2 => {
    if (id === C.id && (phase === "pick2" || phase === "toB")) return toSvg(lesson.c_run.lane);
    return toSvg(byId(id).position);
  };

  const beginAim = (e: React.PointerEvent<SVGElement>): void => {
    if (!canPass) return;
    e.preventDefault();
    e.stopPropagation();
    ensureAudio();
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    setAim(p);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!aim) return;
    const p = getSvgPoint(e.clientX, e.clientY);
    if (p) setAim(p);
  };

  const endAim = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    if (!aim) return;
    const target = [A.id, B.id, C.id]
      .filter((id) => id !== holderId)
      .map((id) => ({ id, d: Math.hypot(teammateSvgPos(id).x - aim.x, teammateSvgPos(id).y - aim.y) }))
      .sort((a, b) => a.d - b.d)[0];
    setAim(null);
    if (target && target.d < PLAYER_R + 5) passTo(target.id);
  };

  const replay = (): void => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    setAim(null);
    setFailVisible(false);
    setPhase("intro");
    setRunId((n) => n + 1);
  };

  const toggleSound = (): void => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      ensureAudio();
      if (audioRef.current) playCheer(audioRef.current);
    }
  };

  /* ---------- Derived positions ---------- */
  const aSvg = toSvg(A.position);
  const bSvg = toSvg(B.position);
  const cFreezeSvg = toSvg(C.position);
  const laneSvg = toSvg(lesson.c_run.lane);
  const receiveSvg = toSvg(lesson.c_run.receive);
  const shotSvg = toSvg(lesson.c_run.shot_from);
  const netSvg = toSvg(lesson.shot_target);
  const blockerSvg = toSvg(blocker.position);

  const ballAtA = feet(A.position, C.position);
  const ballAtB = feet(B.position, A.position);
  const interceptPitch = closestOnSegment(blocker.position, A.position, C.position);
  const interceptSvg = toSvg(interceptPitch);
  const receiveBall = offsetAlong(receiveSvg, 0, BALL_OFFSET);
  const shotBall = offsetAlong(shotSvg, 0, BALL_OFFSET);

  const ballMotion = ((): { animate: Record<string, number | number[]>; transition: Record<string, unknown> } => {
    switch (phase) {
      case "intercept":
        return {
          animate: { x: [ballAtA.x, interceptSvg.x, interceptSvg.x - 2.5], y: [ballAtA.y, interceptSvg.y, interceptSvg.y + 2] },
          transition: { duration: 0.75, times: [0, 0.55, 1], ease: "easeOut" },
        };
      case "toB":
      case "pick2":
        return { animate: { x: ballAtB.x, y: ballAtB.y }, transition: { duration: PASS_AB_MS / 1000, ease: "easeOut" } };
      case "toC":
      case "goal":
      case "success":
        return {
          animate: {
            x: [ballAtB.x, receiveBall.x, shotBall.x, netSvg.x],
            y: [ballAtB.y, receiveBall.y, shotBall.y, netSvg.y],
            scale: [1, 1, 1, 1.45],
          },
          transition: { duration: FINISH_MS / 1000, times: [0, 0.36, 0.72, 1], ease: ["easeOut", "linear", "easeIn"] },
        };
      default:
        return { animate: { x: ballAtA.x, y: ballAtA.y, scale: 1 }, transition: { duration: 0.45 } };
    }
  })();

  const cMotion = ((): { animate: { x: number | number[]; y: number | number[] }; transition: Record<string, unknown> } => {
    switch (phase) {
      case "intro":
        return { animate: { x: cFreezeSvg.x, y: cFreezeSvg.y }, transition: { delay: 0.15, duration: 1.1, ease: "easeIn" } };
      case "toB":
      case "pick2":
        return { animate: { x: laneSvg.x, y: laneSvg.y }, transition: { duration: 1.0, ease: "easeIn" } };
      case "toC":
      case "goal":
      case "success":
        return {
          animate: { x: [laneSvg.x, receiveSvg.x, shotSvg.x, shotSvg.x], y: [laneSvg.y, receiveSvg.y, shotSvg.y, shotSvg.y] },
          transition: { duration: FINISH_MS / 1000, times: [0, 0.36, 0.72, 1], ease: "linear" },
        };
      default:
        return { animate: { x: cFreezeSvg.x, y: cFreezeSvg.y }, transition: { duration: 0.3 } };
    }
  })();

  const ballOnB = phase === "toB" || phase === "pick2" || phase === "toC";
  const blockerTarget =
    phase === "intercept"
      ? { x: interceptSvg.x - 1.5, y: interceptSvg.y + 0.8 }
      : ballOnB || phase === "goal" || phase === "success"
        ? toSvg(lesson.blocker_step_to_b)
        : blockerSvg;
  const ballHolderPos = ballOnB || phase === "goal" || phase === "success" ? B.position : A.position;

  const showBlockedLane = phase === "intro" || phase === "pick1" || phase === "intercept";
  const blockedMid = lerp(aSvg, blockerSvg, 0.5);
  const showArrowAB = ["toB", "pick2", "toC", "goal", "success"].includes(phase);
  const showArrowBC = ["toC", "goal", "success"].includes(phase);

  const fit = fitView(size.w, size.h);
  const toPx = (p: Vec2): Vec2 => ({ x: fit.offX + (p.x - VB.x) * fit.scale, y: fit.offY + (p.y - VB.y) * fit.scale });
  const focus = toPx({ x: 52, y: 70 });
  const maskImage =
    size.w > 0
      ? `radial-gradient(ellipse ${32 * fit.scale}px ${38 * fit.scale}px at ${focus.x}px ${focus.y}px, transparent 62%, black 100%)`
      : "none";
  const showFreeze = phase === "pick1" || phase === "intercept";

  const z = lesson.zone14;
  const zTL = toSvg({ x: z.min_x, y: z.max_y });
  const zBR = toSvg({ x: z.max_x, y: z.min_y });

  const step = phase === "pick2" ? 2 : ["toC", "goal", "success"].includes(phase) ? 3 : phase === "toB" ? 2 : 1;
  const holderSvgPos = holderId === B.id ? bSvg : aSvg;

  const renderTeammate = (p: PitchPlayer, angle: number, halo: boolean, tappable: boolean): React.JSX.Element => (
    <g key={p.id}>
      <PlayerToken label={p.label} side="team" angle={angle} role={p.role} halo={halo} />
      <circle
        r={PLAYER_R + 4}
        fill="transparent"
        style={{ cursor: tappable ? "pointer" : "default", pointerEvents: tappable ? "auto" : "none" }}
        onPointerDown={(e) => {
          if (!tappable) return;
          if (p.id === holderId) {
            beginAim(e);
          } else {
            e.preventDefault();
            e.stopPropagation();
            passTo(p.id);
          }
        }}
      />
    </g>
  );

  /* ---------- Render ---------- */
  return (
    <div className="h-full w-full bg-slate-950">
      <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">

        <motion.div animate={shake} className="flex h-full w-full flex-col">
          {/* ===== Top bar ===== */}
          <header className="relative z-30 flex items-center justify-between gap-2 px-4 pb-2 pt-2.5">
            <div className="flex items-center gap-1.5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200">
              <Target className="h-3.5 w-3.5" />
              {lesson.meta.puzzle_elo_rating}
            </div>
            <h1 className="truncate text-sm font-extrabold text-slate-100">{lesson.context.title_ka}</h1>
            <motion.button
              type="button"
              onClick={replay}
              whileTap={{ rotate: -180, scale: 0.9 }}
              aria-label="replay"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>
          </header>

          {/* ===== Pitch ===== */}
          <section className="relative min-h-0 flex-1 px-3">
            <div ref={pitchRef} className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/10">
              <svg
                key={runId}
                ref={svgRef}
                viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
                preserveAspectRatio="xMidYMin meet"
                className="h-full w-full select-none bg-[#0b2414]"
                style={{ touchAction: "none" }}
                onPointerMove={onPointerMove}
                onPointerUp={endAim}
                onPointerCancel={endAim}
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* userSpaceOnUse: a bounding-box filter would clip straight horizontal/vertical lines */}
                  <filter id="neon" filterUnits="userSpaceOnUse" x={-60} y={-80} width={220} height={320}>
                    <feDropShadow dx="0" dy="0" stdDeviation="0.9" floodColor="#22c55e" floodOpacity="0.9" />
                  </filter>
                  <filter id="redglow" filterUnits="userSpaceOnUse" x={-60} y={-80} width={220} height={320}>
                    <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#ef4444" floodOpacity="0.9" />
                  </filter>
                </defs>

                <PitchMarkings />
                <GoalNet rippling={phase === "goal" || phase === "success"} />

                {/* Zone 14 */}
                <g style={{ pointerEvents: "none" }}>
                  <motion.rect
                    x={zTL.x}
                    y={zTL.y}
                    width={zBR.x - zTL.x}
                    height={zBR.y - zTL.y}
                    rx={1}
                    fill="rgba(168,85,247,0.06)"
                    stroke="#c084fc"
                    strokeWidth={0.35}
                    strokeDasharray="1.6 1.2"
                    animate={{ opacity: [0.45, 0.9, 0.45] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                  <text x={zBR.x - 1.2} y={zBR.y - 1.4} textAnchor="end" fontSize={2.2} fontWeight={900} fill="#d8b4fe" letterSpacing={0.3} fontFamily="ui-sans-serif, system-ui">
                    ZONE 14
                  </text>
                </g>

                {/* Blocked direct lane A → C */}
                {showBlockedLane && (
                  <motion.g
                    style={{ pointerEvents: "none" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.35, 1] }}
                    transition={{ delay: phase === "intro" ? 0.9 : 0, duration: 0.9, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <line
                      x1={aSvg.x}
                      y1={aSvg.y}
                      x2={cFreezeSvg.x}
                      y2={cFreezeSvg.y}
                      stroke="#ef4444"
                      strokeWidth={0.5}
                      strokeDasharray="1.4 1"
                      filter="url(#redglow)"
                    />
                    <g transform={`translate(${blockedMid.x + 4.2} ${blockedMid.y})`}>
                      <rect x={-6.4} y={-2} width={12.8} height={4} rx={2} fill="rgba(69,10,10,0.9)" stroke="#ef4444" strokeWidth={0.3} />
                      <text y={0.8} textAnchor="middle" fontSize={1.9} fontWeight={900} fill="#fecaca" fontFamily="ui-sans-serif, system-ui">
                        🚫 BLOCKED
                      </text>
                    </g>
                  </motion.g>
                )}

                {/* Combination triangle + arrows */}
                {showArrowBC && (
                  <motion.polygon
                    points={`${aSvg.x},${aSvg.y} ${bSvg.x},${bSvg.y} ${receiveSvg.x},${receiveSvg.y}`}
                    fill="#22c55e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.06, 0.16, 0.06] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ pointerEvents: "none" }}
                  />
                )}
                {showArrowAB && <PassArrow from={aSvg} to={bSvg} />}
                {showArrowBC && <PassArrow from={bSvg} to={receiveSvg} />}

                {/* Aim arrow while dragging a pass */}
                {aim && (
                  <line
                    x1={holderSvgPos.x}
                    y1={holderSvgPos.y}
                    x2={aim.x}
                    y2={aim.y}
                    stroke="#67e8f9"
                    strokeWidth={0.5}
                    strokeDasharray="1.2 0.8"
                    strokeLinecap="round"
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Opponents */}
                {lesson.players
                  .filter((p) => p.side === "opponent")
                  .map((p) => {
                    const endPos = toSvg(p.position);
                    const start = toSvg(p.intro_from ?? p.position);
                    const isBlocker = p.id === blocker.id;
                    const target = isBlocker && phase !== "intro" ? blockerTarget : endPos;
                    return (
                      <motion.g
                        key={p.id}
                        initial={{ x: start.x, y: start.y }}
                        animate={{ x: target.x, y: target.y, rotate: isBlocker && phase === "intercept" ? -35 : 0 }}
                        transition={
                          isBlocker && phase === "intercept"
                            ? { duration: 0.42, ease: "easeOut" }
                            : { delay: phase === "intro" ? 0.15 : 0, duration: phase === "intro" ? 1.0 : 0.55, ease: "easeOut" }
                        }
                      >
                        {isBlocker && phase === "intercept" && (
                          <motion.ellipse
                            cx={2.5}
                            cy={1.5}
                            rx={4.5}
                            ry={1.2}
                            fill="rgba(163,230,53,0.35)"
                            initial={{ opacity: 0.9, scaleX: 0.3 }}
                            animate={{ opacity: 0, scaleX: 1.4 }}
                            transition={{ duration: 0.7 }}
                          />
                        )}
                        <PlayerToken label={p.label} side="opponent" angle={bearingDeg(p.position, ballHolderPos)} />
                      </motion.g>
                    );
                  })}

                {/* A (#4) */}
                <g transform={`translate(${aSvg.x} ${aSvg.y})`}>
                  {renderTeammate(A, bearingDeg(A.position, ballOnB ? B.position : C.position), phase === "pick1", phase === "pick1")}
                </g>

                {/* B (#9) — checks back, back to goal */}
                <motion.g
                  initial={{ ...toSvg(B.intro_from ?? B.position) }}
                  animate={{ x: bSvg.x, y: bSvg.y }}
                  transition={{ delay: 0.15, duration: 1.1, ease: "easeOut" }}
                >
                  {renderTeammate(
                    B,
                    phase === "toC" ? bearingDeg(B.position, lesson.c_run.receive) : bearingDeg(B.position, A.position),
                    phase === "pick1",
                    phase === "pick1" || phase === "pick2"
                  )}
                </motion.g>

                {/* C (#8) — runs into Zone 14 */}
                <motion.g initial={{ ...toSvg(C.intro_from ?? C.position) }} animate={cMotion.animate} transition={cMotion.transition}>
                  {renderTeammate(C, 0, phase === "pick1" || phase === "pick2", phase === "pick1" || phase === "pick2")}
                </motion.g>

                {/* Ball */}
                <motion.g
                  initial={{ x: ballAtA.x, y: ballAtA.y }}
                  animate={ballMotion.animate}
                  transition={ballMotion.transition}
                  style={{ pointerEvents: "none" }}
                >
                  <Ball />
                </motion.g>
              </svg>

              {/* Freeze overlay: blurred everywhere except the combination area */}
              <AnimatePresence>
                {showFreeze && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    style={{ WebkitMaskImage: maskImage, maskImage }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  />
                )}
              </AnimatePresence>

              {/* Challenge banner */}
              <AnimatePresence>
                {(phase === "pick1" || phase === "intercept") && (
                  <motion.div
                    className="absolute left-3 right-3 top-3 z-20 flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-950/85 p-3 shadow-2xl backdrop-blur-xl"
                    initial={{ y: -90, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                  >
                    <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                    <div>
                      <p className="text-sm font-extrabold leading-snug">{lesson.context.banner_title_ka}</p>
                      <p className="mt-0.5 text-xs leading-snug text-rose-100/90">{lesson.context.banner_text_ka}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* GOAL pop */}
              <AnimatePresence>
                {phase === "goal" && (
                  <motion.div
                    className="pointer-events-none absolute inset-x-0 z-20 text-center text-5xl font-black tracking-tight text-fuchsia-300 drop-shadow-[0_0_24px_rgba(217,70,239,0.8)]"
                    style={{ top: Math.max(0, toPx({ x: 0, y: 34 }).y) }}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.3, 1.25, 1], opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.4 }}
                    transition={{ duration: 0.5 }}
                  >
                    {lesson.context.goal_pop_ka} ⚽💥
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red flash on interception */}
              <AnimatePresence>
                {failId > 0 && (
                  <motion.div
                    key={failId}
                    className="pointer-events-none absolute inset-0 rounded-[24px] bg-rose-500/25"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ===== Bottom sheet: A ➔ B ➔ C progress + instruction / failure ===== */}
          <section className="relative z-20 mt-3 rounded-t-[28px] border-t border-white/10 bg-slate-900/80 px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-4 backdrop-blur-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-center justify-center gap-2">
              {[
                { role: "A", num: A.label, idx: 1 },
                { role: "B", num: B.label, idx: 2 },
                { role: "C", num: C.label, idx: 3 },
              ].map((s, i) => {
                const done = step > s.idx || (s.idx === 3 && step === 3);
                const active = step === s.idx && phase !== "intro";
                return (
                  <React.Fragment key={s.role}>
                    {i > 0 && (
                      <span className={`text-lg font-black ${step > i ? "text-emerald-400" : "text-slate-600"}`}>➔</span>
                    )}
                    <motion.div
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-black ${
                        done
                          ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                          : active
                            ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                            : "border-white/10 bg-white/5 text-slate-500"
                      }`}
                      animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={{ duration: 1, repeat: active ? Infinity : 0 }}
                    >
                      {s.role}
                      <span className="text-[11px] font-bold opacity-80">#{s.num}</span>
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="mt-3 min-h-[64px]">
              <AnimatePresence mode="wait">
                {failVisible && phase !== "toB" && phase !== "pick2" ? (
                  <motion.div
                    key={`fail-${failId}`}
                    className="flex items-start gap-2.5 rounded-2xl border border-rose-400/40 bg-rose-950/70 p-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <p className="text-[12.5px] font-semibold leading-snug text-rose-50">{lesson.feedback.intercepted_ka}</p>
                  </motion.div>
                ) : (
                  <motion.p
                    key={phase === "intro" ? "intro" : step}
                    className="text-[13px] leading-relaxed text-slate-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {phase === "intro"
                      ? lesson.context.intro_text_ka
                      : step === 1
                        ? lesson.context.step1_ka
                        : step === 2
                          ? lesson.context.step2_ka
                          : "⚽💥"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>
        </motion.div>

        {/* ===== Victory ===== */}
        <AnimatePresence>
          {phase === "success" && (
            <VictoryModal
              title={lesson.feedback.success_title_ka}
              text={lesson.feedback.success_text_ka}
              elo={lesson.rewards.elo}
              badge={lesson.rewards.badge}
              stats={lesson.rewards.stats}
              soundOn={soundOn}
              onToggleSound={toggleSound}
              onReplay={replay}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
