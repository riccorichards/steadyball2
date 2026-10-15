"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useAnimationControls } from "framer-motion";
import { CheckCircle2, Flag, RotateCcw, Sparkles, Target, Trophy, Volume2, VolumeX } from "lucide-react";
import ChallengeEndActions from "@/components/ChallengeEndActions";

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
}

interface Zone {
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
}

type FailReason = "short" | "offside" | "collision" | "zone" | "intercepted";

interface Lesson {
  lesson_id: string;
  meta: { target_age_bracket: string; puzzle_elo_rating: number };
  context: {
    title_ka: string;
    banner_title_ka: string;
    banner_text_ka: string;
    intro_text_ka: string;
    task_ka: string;
    goal_pop_ka: string;
    onside_label: string;
    offside_label: string;
  };
  passer_id: string;
  runner_id: string;
  goalkeeper_id: string;
  players: PitchPlayer[];
  /** Where #11's mindless straight sprint ends in the intro (offside). */
  runner_intro_end: Vec2;
  /** Camera in SVG units: left edge, width and top edge. Height is cropped to fit the screen. */
  camera: { min_x: number; width: number; top: number };
  run: {
    /** Constant sprint speed of the runner. */
    speed_mps: number;
    /** #10 plays the through ball once the runner has covered this distance. Offside is judged then. */
    pass_after_m: number;
    /** Faint guide arc shown on the pitch. */
    ideal_path: Vec2[];
  };
  validation: {
    target_zone: Zone;
    /** The run may not pass closer than this to any defender. */
    defender_clearance_m: number;
    /** The through ball may not pass closer than this to any defender. */
    ball_lane_clearance_m: number;
  };
  shot_target: Vec2;
  feedback: {
    success_title_ka: string;
    success_text_ka: string;
    fail_ka: Record<FailReason, string>;
  };
  rewards: { elo: number; stats: Record<string, string> };
}

const LESSON: Lesson = {
  lesson_id: "SB_TASK_402_001",
  meta: { target_age_bracket: "U12_U14", puzzle_elo_rating: 1300 },
  context: {
    title_ka: "რკალისებრი გარბენი",
    banner_title_ka: "ოფსაიდის ხაფანგი! 🚩",
    banner_text_ka:
      "სწორ ხაზზე თუ გაიქცევი, თამაშგარეში დარჩები! გააკეთე რკალისებრი გარბენი (Curved Run) მცველის ზურგში!",
    intro_text_ka: "უყურე შეტევას…",
    task_ka:
      "დახაზე #11-ის გარბენი თითით: ჯერ ხაზის გასწვრივ, მერე მცველების ზურგში. ⚽ ნიშანი აჩვენებს, სად იქნები, როცა #10 პასს მისცემს.",
    goal_pop_ka: "გოოოლ!",
    onside_label: "ONSIDE ✅",
    offside_label: "OFFSIDE 🚩",
  },
  passer_id: "team_10",
  runner_id: "team_11",
  goalkeeper_id: "opp_gk",
  players: [
    { id: "team_10", label: "10", side: "team", position: { x: 50, y: 45 } },
    { id: "team_11", label: "11", side: "team", position: { x: 22, y: 62 } },
    { id: "opp_2", label: "2", side: "opponent", position: { x: 26, y: 68 }, intro_from: { x: 26, y: 64.5 } },
    { id: "opp_4", label: "4", side: "opponent", position: { x: 47, y: 68 }, intro_from: { x: 47, y: 64.5 } },
    { id: "opp_5", label: "5", side: "opponent", position: { x: 60, y: 68 }, intro_from: { x: 60, y: 64.5 } },
    { id: "opp_3", label: "3", side: "opponent", position: { x: 73, y: 68 }, intro_from: { x: 73, y: 64.5 } },
    { id: "opp_gk", label: "GK", side: "opponent", position: { x: 50, y: 96 } },
  ],
  runner_intro_end: { x: 22, y: 72 },
  camera: { min_x: -4, width: 82, top: -25 },
  run: {
    speed_mps: 7.5,
    pass_after_m: 11.25,
    ideal_path: [
      { x: 22, y: 62 },
      { x: 26, y: 65.2 },
      { x: 31, y: 67 },
      { x: 35.5, y: 67.4 },
      { x: 36, y: 72 },
      { x: 33, y: 79 },
    ],
  },
  validation: {
    target_zone: { min_x: 26, max_x: 38, min_y: 74, max_y: 84 },
    defender_clearance_m: 1.8,
    ball_lane_clearance_m: 1.5,
  },
  shot_target: { x: 49, y: 101.6 },
  feedback: {
    success_title_ka: "გენიალური რკალი! თამაშგარე გატეხილია! 🏃💨",
    success_text_ka:
      "შენ სისწრაფეც შეინარჩუნე და ოფსაიდსაც ასცდი! ელიტური ვინგერები მცველს პირდაპირ კი არ ასწრებენ, არამედ რკალისებურად უვლიან ზურგს!",
    fail_ka: {
      offside: "ოფსაიდი! 🚩 არ იჩქარო წინ გაქცევა — ჯერ რკალი შემოხაზე მცველის ზურგს უკან!",
      short: "გარბენი ძალიან მოკლეა! გააგრძელე მცველების ზურგში, მონიშნულ ზონამდე.",
      collision: "მცველს შეეჯახე! შემოუარე მას ცოტა უფრო შორიდან.",
      zone: "გარბენი მონიშნულ ზონაში დაასრულე — იქ მოგაწვდის #10 ბურთს!",
      intercepted: "მცველი ბურთს მოჭრის! დაასრულე გარბენი ზონის უფრო ღია ნაწილში.",
    },
  },
  rewards: { elo: 25, stats: { DEC: "+3", POS: "+2", SCN: "+2" } },
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
/** Animation runs faster than real time so the run doesn't drag. */
const PLAYBACK = 1.6;
const FINISH_MS = 1400;
const GOAL_HOLD_MS = 1500;

/**
 * Camera: the area that must always be on screen (banner space at the top down to the lowest key player).
 * "xMidYMin meet" fits it on any phone; spare screen space shows more pitch below or at the sides.
 */
const VB = { x: LESSON.camera.min_x, y: LESSON.camera.top, w: LESSON.camera.width, h: 114 };

interface Fit {
  scale: number;
  offX: number;
  offY: number;
}

const fitView = (w: number, h: number): Fit => {
  const scale = Math.min(w / VB.w, h / VB.h);
  return { scale, offX: (w - VB.w * scale) / 2, offY: 0 };
};

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const toSvg = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_W, y: (100 - p.y) * Y_SCALE });

const fromSvg = (x: number, y: number): Vec2 => ({
  x: clamp((x / PITCH_W) * 100, 1, 99),
  y: clamp(100 - y / Y_SCALE, 46, 99),
});

const toMetres = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_WIDTH_M, y: (p.y / 100) * PITCH_LENGTH_M });

const distM = (a: Vec2, b: Vec2): number => {
  const A = toMetres(a);
  const B = toMetres(b);
  return Math.hypot(A.x - B.x, A.y - B.y);
};

/** Shortest distance (metres) from point p to segment a→b. */
const distanceToSegmentM = (p: Vec2, a: Vec2, b: Vec2): number => {
  const P = toMetres(p);
  const A = toMetres(a);
  const B = toMetres(b);
  const vx = B.x - A.x;
  const vy = B.y - A.y;
  const lenSq = vx * vx + vy * vy || 1;
  const t = clamp(((P.x - A.x) * vx + (P.y - A.y) * vy) / lenSq, 0, 1);
  return Math.hypot(P.x - (A.x + t * vx), P.y - (A.y + t * vy));
};

const pathLengthM = (pts: Vec2[]): number =>
  pts.slice(1).reduce((sum, p, i) => sum + distM(pts[i], p), 0);

/** The point `d` metres along a polyline. */
const pointAtDistance = (pts: Vec2[], d: number): Vec2 => {
  let acc = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = distM(pts[i - 1], pts[i]);
    if (acc + seg >= d) return lerp(pts[i - 1], pts[i], seg ? (d - acc) / seg : 0);
    acc += seg;
  }
  return pts[pts.length - 1];
};

/** Equal-distance samples, so a linear-time animation runs at constant speed. */
const resample = (pts: Vec2[], n: number): Vec2[] => {
  const total = pathLengthM(pts);
  return Array.from({ length: n }, (_, i) => pointAtDistance(pts, (total * i) / (n - 1)));
};

const minDistanceToPathM = (p: Vec2, pts: Vec2[]): number => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i += 1) best = Math.min(best, distanceToSegmentM(p, pts[i - 1], pts[i]));
  return best;
};

const inZone = (p: Vec2, z: Zone): boolean =>
  p.x >= z.min_x && p.x <= z.max_x && p.y >= z.min_y && p.y <= z.max_y;

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

/** Smooth SVG path through points (quadratic curves via midpoints). */
const smoothPathD = (pts: Vec2[]): string => {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mid = lerp(pts[i], pts[i + 1], 0.5);
    d += ` Q ${pts[i].x} ${pts[i].y} ${mid.x} ${mid.y}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last.x} ${last.y}`;
};

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

const playCheer = (ctx: AudioContext): void => {
  const duration = 2.8;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
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

/** Two short referee-whistle blasts (pea-rattle trill on a high tone). */
const playWhistle = (ctx: AudioContext): void => {
  const t0 = ctx.currentTime;
  [0, 0.32].forEach((start, i) => {
    const t = t0 + start;
    const len = i === 0 ? 0.22 : 0.4;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 2900;
    const trill = ctx.createOscillator();
    trill.frequency.value = 32;
    const trillGain = ctx.createGain();
    trillGain.gain.value = 180;
    trill.connect(trillGain).connect(osc.frequency);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    gain.gain.setValueAtTime(0.16, t + len - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    trill.start(t);
    osc.stop(t + len);
    trill.stop(t + len);
  });
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
      <path d="M 0 1.5 A 1.5 1.5 0 0 0 1.5 0" {...line} />
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
  halo?: boolean;
}

/** A player disc: bold number (or GK) inside, no labels underneath. */
const PlayerToken: React.FC<TokenProps> = ({ label, side, angle, halo = false }) => {
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
            transition={{ duration: 1.3, repeat: Infinity }}
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
    </g>
  );
};

const Ball: React.FC<{ size?: number }> = ({ size = 1 }) => (
  <g transform={`scale(${size})`}>
    <ellipse cx={0.25} cy={1.15} rx={1.25} ry={0.45} fill="rgba(0,0,0,0.4)" />
    <circle r={1.3} fill="#ffffff" stroke="#0f172a" strokeWidth={0.25} />
    <polygon points="0,-0.55 0.52,-0.17 0.32,0.45 -0.32,0.45 -0.52,-0.17" fill="#0f172a" />
  </g>
);

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
  stats: Record<string, string>;
  soundOn: boolean;
  onToggleSound: () => void;
  onReplay: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ title, text, elo, stats, soundOn, onToggleSound, onReplay }) => {
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
            backgroundColor: ["#22c55e", "#22d3ee", "#facc15", "#f472b6", "#ffffff"][i % 5],
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: 900, rotate: 360 + i * 40, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 7) * 0.08, ease: "easeIn" }}
        />
      ))}

      <motion.div
        className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-6 shadow-[0_0_60px_rgba(34,197,94,0.25)]"
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />

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
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-green-600 shadow-[0_0_40px_rgba(34,197,94,0.55)]"
            initial={{ rotate: -25, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
          >
            <Trophy className="h-12 w-12 text-slate-900" strokeWidth={2.2} />
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

        <motion.div
          className="mx-auto mt-4 w-fit rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 font-mono text-2xl font-black text-emerald-300"
          initial={{ scale: 0.6 }}
          animate={{ scale: [0.6, 1.15, 1] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          +{eloDisplay} ELO
        </motion.div>

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

        <ChallengeEndActions onReplay={onReplay} />
      </motion.div>
    </motion.div>
  );
};

/* ============================================================================
 * 6. MAIN PAGE
 * ========================================================================== */

type Phase = "intro" | "challenge" | "run" | "finish" | "goal" | "success";

interface Toast {
  id: number;
  text: string;
}

export default function CurvedRunPage(): React.JSX.Element {
  const lesson = LESSON;
  const byId = (id: string): PitchPlayer => {
    const p = lesson.players.find((pl) => pl.id === id);
    if (!p) throw new Error(`Unknown player ${id}`);
    return p;
  };
  const passer = byId(lesson.passer_id);
  const runner = byId(lesson.runner_id);
  const keeper = byId(lesson.goalkeeper_id);
  const opponents = lesson.players.filter((p) => p.side === "opponent");
  const defenders = opponents.filter((p) => p.id !== keeper.id);

  /* Offside line = second-last opponent (the keeper is usually the last). */
  const offsideLineY = [...opponents.map((o) => o.position.y)].sort((a, b) => b - a)[1];
  const isOffside = (p: Vec2): boolean => p.y > offsideLineY && p.y > passer.position.y && p.y > 50;

  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [path, setPath] = useState<Vec2[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [failId, setFailId] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const pitchRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });
  const audioRef = useRef<AudioContext | null>(null);
  const timeouts = useRef<number[]>([]);
  const shake = useAnimationControls();
  const size = useElementSize(pitchRef);

  /* ---------- Phase timeline ---------- */
  useEffect(() => {
    const t = window.setTimeout(() => setPhase("challenge"), INTRO_MS);
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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ---------- Path analysis (live) ---------- */
  const D = lesson.run.pass_after_m;
  const pathLen = path.length > 1 ? pathLengthM(path) : 0;
  const passPoint: Vec2 | null =
    path.length > 1 ? (pathLen >= D ? pointAtDistance(path, D) : drawing ? path[path.length - 1] : null) : null;
  const offsideAtPass = passPoint !== null && isOffside(passPoint);
  const endPoint = path.length > 1 ? path[path.length - 1] : null;

  const failReason = (): FailReason | null => {
    if (path.length < 2 || pathLen < D) return "short";
    if (offsideAtPass) return "offside";
    if (defenders.some((d) => minDistanceToPathM(d.position, path) < lesson.validation.defender_clearance_m))
      return "collision";
    if (!endPoint || !inZone(endPoint, lesson.validation.target_zone)) return "zone";
    if (
      defenders.some(
        (d) => distanceToSegmentM(d.position, passer.position, endPoint) < lesson.validation.ball_lane_clearance_m
      )
    )
      return "intercepted";
    return null;
  };

  /* ---------- Drawing the run ---------- */
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

  const beginDraw = (e: React.PointerEvent<SVGElement>): void => {
    if (phase !== "challenge") return;
    e.preventDefault();
    e.stopPropagation();
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    const s = toSvg(runner.position);
    dragOffset.current = { x: p.x - s.x, y: p.y - s.y };
    svgRef.current?.setPointerCapture(e.pointerId);
    setPath([runner.position]);
    setDrawing(true);
    setToast(null);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!drawing || phase !== "challenge") return;
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    const q = fromSvg(p.x - dragOffset.current.x, p.y - dragOffset.current.y);
    setPath((prev) => (prev.length && distM(prev[prev.length - 1], q) < 0.6 ? prev : [...prev, q]));
  };

  const endDraw = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    setDrawing(false);
  };

  /* ---------- Confirm ---------- */
  const ensureAudio = (): void => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    if (audioRef.current?.state === "suspended") audioRef.current.resume().catch(() => undefined);
  };

  const vibrate = (pattern: number | number[]): void => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  };

  const runSeconds = pathLen / lesson.run.speed_mps / PLAYBACK;
  const passSeconds = D / lesson.run.speed_mps / PLAYBACK;

  const handleConfirm = (): void => {
    if (phase !== "challenge") return;
    ensureAudio();

    const reason = failReason();
    if (reason) {
      setToast({ id: Date.now(), text: lesson.feedback.fail_ka[reason] });
      setFailId((n) => n + 1);
      shake.start({ x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.5 } });
      vibrate([60, 40, 60]);
      if (soundOn && audioRef.current) playWhistle(audioRef.current);
      return;
    }

    setToast(null);
    setPhase("run");
    const runMs = runSeconds * 1000;
    const t1 = window.setTimeout(() => setPhase("finish"), runMs);
    const t2 = window.setTimeout(() => {
      setPhase("goal");
      vibrate([80, 40, 140]);
      if (soundOn && audioRef.current) playCheer(audioRef.current);
    }, runMs + FINISH_MS);
    const t3 = window.setTimeout(() => setPhase("success"), runMs + FINISH_MS + GOAL_HOLD_MS);
    timeouts.current.push(t1, t2, t3);
  };

  const replay = (): void => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    setPath([]);
    setDrawing(false);
    setToast(null);
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

  /* ---------- Derived SVG geometry ---------- */
  const lineSvgY = toSvg({ x: 0, y: offsideLineY }).y;
  const lineIntroShift = (offsideLineY - (defenders[0].intro_from?.y ?? offsideLineY)) * Y_SCALE;
  const lineState: "onside" | "offside" =
    phase === "intro" ? "offside" : phase === "challenge" && offsideAtPass ? "offside" : "onside";
  const lineColor = lineState === "offside" ? "#ef4444" : "#22c55e";

  const passerSvg = toSvg(passer.position);
  const runnerStartSvg = toSvg(runner.position);
  const idealEnd = lesson.run.ideal_path[lesson.run.ideal_path.length - 1];
  const ballAtPasser = offsetAlong(passerSvg, bearingDeg(passer.position, idealEnd), BALL_OFFSET);

  const runPts = path.length > 1 ? resample(path, 48).map(toSvg) : [runnerStartSvg];
  const lastSvg = runPts[runPts.length - 1];
  const endBall = offsetAlong(
    lastSvg,
    endPoint && path.length > 2 ? bearingDeg(path[path.length - 3], endPoint) : 0,
    BALL_OFFSET
  );

  /* Finish: take a touch toward goal, keeper rushes out, round him, roll it into the empty net. */
  const end = endPoint ?? runner.position;
  const w1 = lerp(end, { x: 50, y: 97 }, 0.35);
  const gkRush = lerp(keeper.position, w1, 0.4);
  const w2: Vec2 = { x: gkRush.x + 7, y: gkRush.y - 2.5 };
  const w3: Vec2 = { x: 51, y: 95 };
  const finishPts = [end, w1, w2, w3].map(toSvg);
  const netSvg = toSvg(lesson.shot_target);
  const finishTimes = [0, 0.3, 0.6, 0.82, 1];

  const runnerMotion = (() => {
    if (phase === "intro") {
      const e = toSvg(lesson.runner_intro_end);
      return {
        animate: { x: e.x, y: e.y },
        transition: { delay: 0.15, duration: 1.0, ease: "easeIn" as const },
      };
    }
    if (phase === "challenge") {
      const live = drawing && path.length ? toSvg(path[path.length - 1]) : runnerStartSvg;
      return {
        animate: { x: live.x, y: live.y },
        transition: drawing ? { duration: 0 } : { duration: 0.45, ease: [0.3, 0, 0.2, 1] as [number, number, number, number] },
      };
    }
    if (phase === "run") {
      return {
        animate: { x: runPts.map((p) => p.x), y: runPts.map((p) => p.y) },
        transition: { duration: runSeconds, ease: "linear" as const },
      };
    }
    return {
      animate: { x: [...finishPts.map((p) => p.x), finishPts[3].x], y: [...finishPts.map((p) => p.y), finishPts[3].y] },
      transition: { duration: FINISH_MS / 1000, times: finishTimes, ease: "easeInOut" as const },
    };
  })();

  const ballMotion = (() => {
    if (phase === "run") {
      return {
        animate: { x: [ballAtPasser.x, endBall.x], y: [ballAtPasser.y, endBall.y], scale: 1 },
        transition: { delay: passSeconds, duration: Math.max(0.2, runSeconds - passSeconds), ease: "easeOut" as const },
      };
    }
    if (phase === "finish" || phase === "goal" || phase === "success") {
      const pts = [endBall, ...finishPts.slice(1).map((p, i) => offsetAlong(p, i === 2 ? 0 : 20, BALL_OFFSET * 0.8)), netSvg];
      return {
        animate: { x: pts.map((p) => p.x), y: pts.map((p) => p.y), scale: 1 },
        transition: { duration: FINISH_MS / 1000, times: finishTimes, ease: "easeInOut" as const },
      };
    }
    return {
      animate: { x: ballAtPasser.x, y: ballAtPasser.y, scale: 1 },
      transition: { duration: 0.3 },
    };
  })();

  const finishing = phase === "finish" || phase === "goal" || phase === "success";
  const keeperSvg = toSvg(keeper.position);
  const keeperRushSvg = toSvg(gkRush);

  /* Freeze overlay keeps the left channel sharp; everything else is blurred. */
  const fit = fitView(size.w, size.h);
  const toPx = (p: Vec2): Vec2 => ({ x: fit.offX + (p.x - VB.x) * fit.scale, y: fit.offY + (p.y - VB.y) * fit.scale });
  const focus = toPx({ x: 30, y: 42 });
  const maskImage =
    size.w > 0
      ? `radial-gradient(ellipse ${38 * fit.scale}px ${32 * fit.scale}px at ${focus.x}px ${focus.y}px, transparent 62%, black 100%)`
      : "none";

  const zone = lesson.validation.target_zone;
  const zoneTL = toSvg({ x: zone.min_x, y: zone.max_y });
  const zoneBR = toSvg({ x: zone.max_x, y: zone.min_y });
  const endInZone = endPoint !== null && inZone(endPoint, zone);
  const runnerAngle =
    phase === "challenge" && drawing && path.length > 2
      ? bearingDeg(path[path.length - 3], path[path.length - 1])
      : phase === "run" && endPoint
        ? bearingDeg(runner.position, endPoint)
        : 0;

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
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* userSpaceOnUse: a bounding-box filter clips perfectly horizontal lines */}
                  <filter
                    id="laser"
                    filterUnits="userSpaceOnUse"
                    x={-60}
                    y={-80}
                    width={220}
                    height={320}
                  >
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <PitchMarkings />
                <GoalNet rippling={phase === "goal" || phase === "success"} />

                {/* Target channel behind the back line */}
                {phase !== "intro" && (
                  <g style={{ pointerEvents: "none" }}>
                    <rect
                      x={zoneTL.x}
                      y={zoneTL.y}
                      width={zoneBR.x - zoneTL.x}
                      height={zoneBR.y - zoneTL.y}
                      rx={1}
                      fill={endInZone ? "rgba(34,197,94,0.14)" : "rgba(34,211,238,0.07)"}
                    />
                    <motion.rect
                      x={zoneTL.x}
                      y={zoneTL.y}
                      width={zoneBR.x - zoneTL.x}
                      height={zoneBR.y - zoneTL.y}
                      rx={1}
                      fill="none"
                      stroke={endInZone ? "#22c55e" : "#22d3ee"}
                      strokeWidth={0.4}
                      strokeDasharray="1.6 1.1"
                      animate={{ strokeDashoffset: [0, -5.4], opacity: [0.55, 1, 0.55] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                  </g>
                )}

                {/* Offside laser line, tied to the second-last defender */}
                <motion.g
                  initial={{ y: lineIntroShift }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15, duration: 0.9, ease: [0.3, 0, 0.2, 1] }}
                  style={{ pointerEvents: "none" }}
                >
                  <motion.line
                    x1={-60}
                    x2={160}
                    y1={lineSvgY}
                    y2={lineSvgY}
                    stroke={lineColor}
                    strokeWidth={0.5}
                    strokeDasharray="2.2 1.2"
                    filter="url(#laser)"
                    animate={
                      lineState === "offside"
                        ? { opacity: [1, 0.35, 1], strokeDashoffset: [0, -6.8] }
                        : { opacity: 0.95, strokeDashoffset: [0, -6.8] }
                    }
                    transition={{ duration: lineState === "offside" ? 0.5 : 1.8, repeat: Infinity, ease: "linear" }}
                  />
                  <text
                    x={VB.x + 1.5}
                    y={lineSvgY - 1.6}
                    fontSize={2.5}
                    fontWeight={900}
                    fill={lineColor}
                    fontFamily="ui-sans-serif, system-ui"
                    letterSpacing={0.2}
                  >
                    {lineState === "offside" ? lesson.context.offside_label : lesson.context.onside_label}
                  </text>
                </motion.g>

                {/* Faint ideal arc (guide) */}
                {phase === "challenge" && (
                  <path
                    d={smoothPathD(lesson.run.ideal_path.map(toSvg))}
                    fill="none"
                    stroke="#67e8f9"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    opacity={0.16}
                    filter="url(#glow)"
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* The run the child drew */}
                {path.length > 1 && (phase === "challenge" || phase === "run") && (
                  <g style={{ pointerEvents: "none" }}>
                    <polyline
                      points={path.map(toSvg).map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth={0.55}
                      strokeDasharray="1.3 0.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {passPoint && phase === "challenge" && (
                      <g transform={`translate(${toSvg(passPoint).x} ${toSvg(passPoint).y})`}>
                        <circle
                          r={2.6}
                          fill={offsideAtPass ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.22)"}
                          stroke={offsideAtPass ? "#ef4444" : "#22c55e"}
                          strokeWidth={0.45}
                          filter="url(#glow)"
                        />
                        <Ball size={0.75} />
                        {offsideAtPass && (
                          <motion.text
                            y={-4}
                            textAnchor="middle"
                            fontSize={3.4}
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                          >
                            🚩
                          </motion.text>
                        )}
                      </g>
                    )}
                  </g>
                )}

                {/* Defenders (step up together in the intro) and the keeper */}
                {opponents.map((p) => {
                  const endPos = toSvg(p.position);
                  const start = toSvg(p.intro_from ?? p.position);
                  const isKeeper = p.id === keeper.id;
                  return (
                    <motion.g
                      key={p.id}
                      initial={{ x: start.x, y: start.y }}
                      animate={
                        isKeeper && finishing
                          ? { x: keeperRushSvg.x, y: keeperRushSvg.y }
                          : { x: endPos.x, y: endPos.y }
                      }
                      transition={
                        isKeeper && finishing
                          ? { delay: 0.15, duration: 0.55, ease: "easeOut" }
                          : { delay: 0.15, duration: 0.9, ease: [0.3, 0, 0.2, 1] }
                      }
                    >
                      <PlayerToken
                        label={p.label}
                        side="opponent"
                        angle={bearingDeg(p.position, isKeeper && finishing ? end : passer.position)}
                      />
                    </motion.g>
                  );
                })}

                {/* Playmaker #10 */}
                <g transform={`translate(${passerSvg.x} ${passerSvg.y})`}>
                  <PlayerToken label={passer.label} side="team" angle={bearingDeg(passer.position, idealEnd)} />
                </g>

                {/* Runner #11 */}
                <motion.g initial={{ x: runnerStartSvg.x, y: runnerStartSvg.y }} {...runnerMotion}>
                  <PlayerToken label={runner.label} side="team" angle={runnerAngle} halo={phase === "challenge"} />
                  {phase === "intro" && (
                    <motion.text
                      y={-PLAYER_R - 2.6}
                      textAnchor="middle"
                      fontSize={4.2}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: [0, 1, 0.4, 1], scale: [0.4, 1.3, 1, 1.15] }}
                      transition={{ delay: 0.95, duration: 0.5 }}
                      style={{ pointerEvents: "none" }}
                    >
                      🚩
                    </motion.text>
                  )}
                  <circle
                    r={PLAYER_R + 3.5}
                    fill="transparent"
                    style={{
                      cursor: phase === "challenge" ? (drawing ? "grabbing" : "grab") : "default",
                      pointerEvents: phase === "challenge" ? "auto" : "none",
                    }}
                    onPointerDown={beginDraw}
                  />
                </motion.g>

                {/* Ball */}
                <motion.g
                  initial={{ x: ballAtPasser.x, y: ballAtPasser.y }}
                  animate={ballMotion.animate}
                  transition={ballMotion.transition}
                  style={{ pointerEvents: "none" }}
                >
                  <Ball />
                </motion.g>
              </svg>

              {/* Freeze overlay: blurred everywhere except the left channel */}
              <AnimatePresence>
                {phase === "challenge" && (
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
                {phase === "challenge" && (
                  <motion.div
                    className="absolute left-3 right-3 top-3 z-20 flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-950/85 p-3 shadow-2xl backdrop-blur-xl"
                    initial={{ y: -90, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                  >
                    <Flag className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
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
                    className="pointer-events-none absolute inset-x-0 z-20 text-center text-5xl font-black tracking-tight text-emerald-300 drop-shadow-[0_0_24px_rgba(34,197,94,0.8)]"
                    style={{ top: Math.max(0, toPx({ x: 0, y: 30 }).y) }}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.3, 1.25, 1], opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.4 }}
                    transition={{ duration: 0.5 }}
                  >
                    {lesson.context.goal_pop_ka} ⚽⚡
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Referee toast */}
              <AnimatePresence>
                {toast && (
                  <motion.div
                    key={toast.id}
                    className="absolute bottom-3 left-3 right-3 z-20 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-950/90 p-3 shadow-2xl backdrop-blur-xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                  >
                    <motion.div
                      className="mt-0.5 shrink-0"
                      animate={{ rotate: [0, -18, 18, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Flag className="h-5 w-5 text-amber-300" />
                    </motion.div>
                    <p className="text-xs font-semibold leading-snug text-amber-50">{toast.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red flash on failure */}
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

          {/* ===== Bottom sheet ===== */}
          <section className="relative z-20 mt-3 rounded-t-[28px] border-t border-white/10 bg-slate-900/80 px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-4 backdrop-blur-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            {phase === "intro" ? (
              <div className="flex h-[52px] items-center gap-2 text-sm font-semibold text-slate-300">
                <motion.span
                  className="h-2 w-2 rounded-full bg-cyan-300"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
                {lesson.context.intro_text_ka}
              </div>
            ) : (
              <p className="min-h-[52px] text-[12.5px] leading-relaxed text-slate-300">{lesson.context.task_ka}</p>
            )}

            <motion.button
              type="button"
              onClick={handleConfirm}
              disabled={phase !== "challenge" || drawing}
              whileTap={{ scale: 0.96 }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 py-4 text-lg font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.35)] transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.6} />
              შემოწმება
            </motion.button>
          </section>
        </motion.div>

        {/* ===== Victory ===== */}
        <AnimatePresence>
          {phase === "success" && (
            <VictoryModal
              title={lesson.feedback.success_title_ka}
              text={lesson.feedback.success_text_ka}
              elo={lesson.rewards.elo}
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
