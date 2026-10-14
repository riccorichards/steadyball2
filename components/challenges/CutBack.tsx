"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useAnimationControls } from "framer-motion";
import {
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";

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
  /** Intro animation: where the player starts before running to `position`. */
  intro_from?: Vec2;
  draggable?: boolean;
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
    task_ka: string;
    goal_pop_ka: string;
  };
  crosser_id: string;
  striker_id: string;
  players: PitchPlayer[];
  /** Camera in SVG units: left edge, width and top edge. Height is cropped to fit the screen. */
  camera: { min_x: number; width: number; top: number };
  validation: {
    target_zone: Zone;
    /** The cut-back lane is open when every opponent is at least this far (metres) from it. */
    lane_clearance_m: number;
  };
  /** Where the shot ends, in pitch coords (y > 100 = inside the net). */
  shot_target: Vec2;
  feedback: { success_title_ka: string; success_text_ka: string; failure_ka: string };
  rewards: { elo: number; stats: Record<string, string> };
}

const LESSON: Lesson = {
  lesson_id: "SB_TASK_401_001",
  meta: { target_age_bracket: "U12_U14", puzzle_elo_rating: 1250 },
  context: {
    title_ka: "Cut-Back და დამუხრუჭება",
    banner_title_ka: "ყველა მცველი მეკარესთან გარბის! 🛑",
    banner_text_ka: "დააჭირე მუხრუჭს! დაიხიე ცარიელ პენალტის წერტილზე (Cut-Back ზონაში)!",
    intro_text_ka: "უყურე შეტევას…",
    task_ka: "გადაათრიე #9 უკან, ოქროსფერ ზონაში — პენალტის წერტილთან, სადაც არავინ არის.",
    goal_pop_ka: "გოოოლ!",
  },
  crosser_id: "team_7",
  striker_id: "team_9",
  players: [
    { id: "team_7", label: "7", side: "team", position: { x: 85, y: 97 }, intro_from: { x: 86, y: 70 } },
    { id: "team_9", label: "9", side: "team", position: { x: 50.5, y: 95.3 }, intro_from: { x: 50, y: 82 }, draggable: true },
    { id: "opp_gk", label: "GK", side: "opponent", position: { x: 56, y: 99.4 }, intro_from: { x: 50, y: 99.4 } },
    { id: "opp_4", label: "4", side: "opponent", position: { x: 63.5, y: 97.2 }, intro_from: { x: 60, y: 82 } },
    { id: "opp_5", label: "5", side: "opponent", position: { x: 43.5, y: 96.5 }, intro_from: { x: 45, y: 83 } },
  ],
  camera: { min_x: 38, width: 54, top: -19 },
  validation: {
    target_zone: { min_x: 44, max_x: 56, min_y: 85, max_y: 92 },
    lane_clearance_m: 2,
  },
  shot_target: { x: 45.8, y: 101.6 },
  feedback: {
    success_title_ka: "გოოოლ! იდეალური CUT-BACK! ⚽🎯",
    success_text_ka:
      "მცველების ინერცია გამოიყენე! როცა ყველა კარისკენ გარბის, პენალტის წერტილი ყველაზე თავისუფალი და საგოლე ადგილია!",
    failure_ka: "მცველებთან ძალიან ახლოს ხარ! დაიხიე უკან, ცარიელ პენალტის წერტილზე!",
  },
  rewards: { elo: 25, stats: { ATT: "+3", DEC: "+2", POS: "+2" } },
};

/* ============================================================================
 * 2. GEOMETRY
 *    Pitch: X 0 = left, 100 = right · Y 0 = own goal (bottom), 100 = opponent goal (top)
 *    SVG  : svgY = (100 - y) * 1.5, so the pitch has real 68 × 105 proportions
 * ========================================================================== */

const PITCH_W = 100;
const PITCH_H = 150;
const Y_SCALE = PITCH_H / 100;
const PLAYER_R = 3.2;
const BALL_OFFSET = PLAYER_R + 1.3;
const INTRO_MS = 1500;
const PITCH_WIDTH_M = 68;
const PITCH_LENGTH_M = 105;

/**
 * Camera: the area that must always be on screen (banner space at the top down past the box).
 * "xMidYMin meet" fits it on any phone; spare screen space shows more pitch below or at the sides.
 */
const VB = { x: LESSON.camera.min_x, y: LESSON.camera.top, w: LESSON.camera.width, h: 69 };

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

const toSvg = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_W, y: (100 - p.y) * Y_SCALE });

const fromSvg = (x: number, y: number): Vec2 => ({
  x: clamp((x / PITCH_W) * 100, 2, 98),
  y: clamp(100 - y / Y_SCALE, 45, 99.5),
});

const toMetres = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_WIDTH_M, y: (p.y / 100) * PITCH_LENGTH_M });

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

      {/* Attacking end (top): box, six-yard box, spot, arc */}
      <rect x={20.35} y={0} width={59.3} height={23.6} {...line} />
      <rect x={36.55} y={0} width={26.9} height={7.9} {...line} />
      <circle cx={50} cy={15.7} r={0.55} fill="rgba(255,255,255,0.95)" />
      <path d="M 39.3 23.6 A 13.3 13.3 0 0 0 60.7 23.6" {...line} />
      <path d={`M ${PITCH_W - 1.5} 0 A 1.5 1.5 0 0 0 ${PITCH_W} 1.5`} {...line} />
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
        y={label.length > 1 ? 0.85 : 1.1}
        textAnchor="middle"
        fontSize={label.length > 1 ? 2.3 : 3.2}
        fontWeight={900}
        fill="#ffffff"
        fontFamily="ui-sans-serif, system-ui"
      >
        {label}
      </text>
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

/* ============================================================================
 * 5. VICTORY MODAL
 * ========================================================================== */

const STAT_LABELS_KA: Record<string, string> = {
  ATT: "შეტევა",
  DEC: "გადაწყვეტილება",
  POS: "პოზიციონირება",
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
            backgroundColor: ["#facc15", "#22d3ee", "#22c55e", "#f472b6", "#ffffff"][i % 5],
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: 900, rotate: 360 + i * 40, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 7) * 0.08, ease: "easeIn" }}
        />
      ))}

      <motion.div
        className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-6 shadow-[0_0_60px_rgba(250,204,21,0.25)]"
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />

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
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(250,204,21,0.55)]"
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

        <motion.button
          type="button"
          onClick={onReplay}
          whileTap={{ scale: 0.97 }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 py-4 text-base font-extrabold text-slate-900 shadow-[0_8px_30px_rgba(251,191,36,0.4)]"
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

type Phase = "intro" | "challenge" | "cutback" | "goal" | "success";

const CUTBACK_MS = 1250;
const MODAL_MS = 2700;

export default function CutBackPage(): React.JSX.Element {
  const lesson = LESSON;
  const byId = (id: string): PitchPlayer => {
    const p = lesson.players.find((pl) => pl.id === id);
    if (!p) throw new Error(`Unknown player ${id}`);
    return p;
  };
  const crosser = byId(lesson.crosser_id);
  const striker = byId(lesson.striker_id);
  const opponents = lesson.players.filter((p) => p.side === "opponent");

  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [strikerPos, setStrikerPos] = useState<Vec2>(striker.position);
  const [dragging, setDragging] = useState(false);
  const [toastId, setToastId] = useState<number | null>(null);
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
    if (toastId === null) return;
    const t = window.setTimeout(() => setToastId(null), 4200);
    return () => window.clearTimeout(t);
  }, [toastId]);

  /* ---------- Validation (live) ---------- */
  const zone = lesson.validation.target_zone;
  const inTarget = inZone(strikerPos, zone);
  const laneOpen = opponents.every(
    (o) => distanceToSegmentM(o.position, crosser.position, strikerPos) >= lesson.validation.lane_clearance_m
  );
  const valid = inTarget && laneOpen;

  /* ---------- Dragging ---------- */
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

  const beginDrag = (e: React.PointerEvent<SVGElement>): void => {
    if (phase !== "challenge") return;
    e.preventDefault();
    e.stopPropagation();
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    const s = toSvg(strikerPos);
    dragOffset.current = { x: p.x - s.x, y: p.y - s.y };
    svgRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    setToastId(null);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!dragging || phase !== "challenge") return;
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setStrikerPos(fromSvg(p.x - dragOffset.current.x, p.y - dragOffset.current.y));
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  /* ---------- Confirm ---------- */
  const ensureAudio = (): void => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    if (audioRef.current?.state === "suspended") audioRef.current.resume().catch(() => undefined);
  };

  const vibrate = (pattern: number | number[]): void => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  };

  const handleConfirm = (): void => {
    if (phase !== "challenge") return;
    ensureAudio();

    if (!valid) {
      setToastId(Date.now());
      setFailId((n) => n + 1);
      shake.start({ x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.5 } });
      vibrate([60, 40, 60]);
      return;
    }

    setToastId(null);
    setPhase("cutback");
    const tGoal = window.setTimeout(() => {
      setPhase("goal");
      vibrate([80, 40, 140]);
      if (soundOn && audioRef.current) playCheer(audioRef.current);
    }, CUTBACK_MS);
    const tModal = window.setTimeout(() => setPhase("success"), MODAL_MS);
    timeouts.current.push(tGoal, tModal);
  };

  const replay = (): void => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    setStrikerPos(striker.position);
    setDragging(false);
    setToastId(null);
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

  /* ---------- Derived SVG positions ---------- */
  const crosserSvg = toSvg(crosser.position);
  const strikerSvg = toSvg(strikerPos);
  const ballAtCrosser = offsetAlong(crosserSvg, bearingDeg(crosser.position, striker.position), BALL_OFFSET);
  const ballIntroStart = offsetAlong(toSvg(crosser.intro_from ?? crosser.position), 0, BALL_OFFSET);
  const ballAtStriker = offsetAlong(strikerSvg, bearingDeg(strikerPos, crosser.position), BALL_OFFSET);
  const goalSpot = toSvg(lesson.shot_target);

  const shotPlaying = phase === "cutback" || phase === "goal" || phase === "success";
  const ballAnimate = shotPlaying
    ? {
        x: [ballAtCrosser.x, ballAtStriker.x, ballAtStriker.x, goalSpot.x],
        y: [ballAtCrosser.y, ballAtStriker.y, ballAtStriker.y, goalSpot.y],
        scale: [1, 1, 1, 1.45],
      }
    : { x: ballAtCrosser.x, y: ballAtCrosser.y, scale: 1 };
  const ballTransition = shotPlaying
    ? {
        duration: CUTBACK_MS / 1000,
        times: [0, 0.48, 0.58, 1],
        ease: ["easeOut", "linear", "easeIn"] as ("easeOut" | "linear" | "easeIn")[],
      }
    : { delay: 0.2, duration: 1.1, ease: [0.3, 0, 0.2, 1] as [number, number, number, number] };

  const zoneTL = toSvg({ x: zone.min_x, y: zone.max_y });
  const zoneBR = toSvg({ x: zone.max_x, y: zone.min_y });
  const spot = toSvg({ x: 50, y: 100 - 11 / (PITCH_LENGTH_M / 100) });

  /* Freeze overlay keeps the penalty box sharp; everything else is blurred. */
  const fit = fitView(size.w, size.h);
  const toPx = (p: Vec2): Vec2 => ({ x: fit.offX + (p.x - VB.x) * fit.scale, y: fit.offY + (p.y - VB.y) * fit.scale });
  const focus = toPx({ x: 64, y: 11 });
  const maskImage =
    size.w > 0
      ? `radial-gradient(ellipse ${40 * fit.scale}px ${24 * fit.scale}px at ${focus.x}px ${focus.y}px, transparent 62%, black 100%)`
      : "none";

  const playerAngle = (p: PitchPlayer): number => {
    if (p.id === crosser.id) return phase === "intro" ? 0 : bearingDeg(crosser.position, strikerPos);
    if (p.side === "opponent") return bearingDeg(p.position, crosser.position);
    return 0;
  };

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
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <PitchMarkings />
                <GoalNet rippling={phase === "goal" || phase === "success"} />

                {/* Golden cut-back pocket around the penalty spot */}
                {phase !== "intro" && (
                  <g style={{ pointerEvents: "none" }}>
                    <rect
                      x={zoneTL.x}
                      y={zoneTL.y}
                      width={zoneBR.x - zoneTL.x}
                      height={zoneBR.y - zoneTL.y}
                      rx={1}
                      fill={inTarget ? "rgba(34,197,94,0.16)" : "rgba(250,204,21,0.08)"}
                    />
                    <motion.rect
                      x={zoneTL.x}
                      y={zoneTL.y}
                      width={zoneBR.x - zoneTL.x}
                      height={zoneBR.y - zoneTL.y}
                      rx={1}
                      fill="none"
                      stroke={inTarget ? "#22c55e" : "#facc15"}
                      strokeWidth={0.4}
                      strokeDasharray="1.6 1.1"
                      filter="url(#glow)"
                      animate={{ strokeDashoffset: [0, -5.4], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.circle
                      cx={spot.x}
                      cy={spot.y}
                      r={2.6}
                      fill="none"
                      stroke={inTarget ? "#22c55e" : "#facc15"}
                      strokeWidth={0.45}
                      filter="url(#glow)"
                      animate={{ r: [2.2, 3.6, 2.2], opacity: [1, 0.35, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  </g>
                )}

                {/* Cut-back lane preview while dragging toward a valid spot */}
                {phase === "challenge" && valid && (
                  <line
                    x1={ballAtCrosser.x}
                    y1={ballAtCrosser.y}
                    x2={ballAtStriker.x}
                    y2={ballAtStriker.y}
                    stroke="#22c55e"
                    strokeWidth={0.35}
                    strokeDasharray="1.2 0.9"
                    opacity={0.8}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Non-draggable players run in during the intro */}
                {lesson.players
                  .filter((p) => !p.draggable)
                  .map((p) => {
                    const end = toSvg(p.position);
                    const start = toSvg(p.intro_from ?? p.position);
                    return (
                      <motion.g
                        key={p.id}
                        initial={{ x: start.x, y: start.y }}
                        animate={{ x: end.x, y: end.y }}
                        transition={{ delay: 0.2, duration: 1.1, ease: [0.3, 0, 0.2, 1] }}
                      >
                        <PlayerToken label={p.label} side={p.side} angle={playerAngle(p)} />
                      </motion.g>
                    );
                  })}

                {/* Striker #9 (draggable) */}
                {(() => {
                  const start = toSvg(striker.intro_from ?? striker.position);
                  const canDrag = phase === "challenge";
                  return (
                    <motion.g
                      initial={{ x: start.x, y: start.y }}
                      animate={{ x: strikerSvg.x, y: strikerSvg.y }}
                      transition={phase === "intro" ? { delay: 0.2, duration: 1.1, ease: [0.3, 0, 0.2, 1] } : { duration: 0 }}
                    >
                      <PlayerToken
                        label={striker.label}
                        side="team"
                        angle={phase === "intro" ? 0 : bearingDeg(strikerPos, crosser.position)}
                        halo={canDrag}
                      />
                      <circle
                        r={PLAYER_R + 3.5}
                        fill="transparent"
                        style={{
                          cursor: canDrag ? (dragging ? "grabbing" : "grab") : "default",
                          pointerEvents: canDrag ? "auto" : "none",
                        }}
                        onPointerDown={beginDrag}
                      />
                    </motion.g>
                  );
                })()}

                {/* Ball */}
                <motion.g
                  initial={{ x: ballIntroStart.x, y: ballIntroStart.y }}
                  animate={ballAnimate}
                  transition={ballTransition}
                  style={{ pointerEvents: "none" }}
                >
                  <Ball />
                </motion.g>
              </svg>

              {/* Freeze overlay: blurred everywhere except the penalty box */}
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

              {/* Challenge banner (sits in the space above the goal) */}
              <AnimatePresence>
                {phase === "challenge" && (
                  <motion.div
                    className="absolute left-3 right-3 top-3 z-20 flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-950/85 p-3 shadow-2xl backdrop-blur-xl"
                    initial={{ y: -90, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                  >
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
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
                    className="pointer-events-none absolute inset-x-0 z-20 text-center text-5xl font-black tracking-tight text-yellow-300 drop-shadow-[0_0_24px_rgba(250,204,21,0.8)]"
                    style={{ top: Math.max(0, toPx({ x: 0, y: 28 }).y) }}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.3, 1.25, 1], opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.4 }}
                    transition={{ duration: 0.5 }}
                  >
                    {lesson.context.goal_pop_ka} ⚽🔥
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Failure toast */}
              <AnimatePresence>
                {toastId !== null && (
                  <motion.div
                    key={toastId}
                    className="absolute bottom-3 left-3 right-3 z-20 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-950/85 p-3 shadow-2xl backdrop-blur-xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                  >
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-xs font-semibold leading-snug text-amber-50">{lesson.feedback.failure_ka}</p>
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
              <p className="min-h-[52px] text-[13px] leading-relaxed text-slate-300">{lesson.context.task_ka}</p>
            )}

            <motion.button
              type="button"
              onClick={handleConfirm}
              disabled={phase !== "challenge"}
              whileTap={{ scale: 0.96 }}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black text-slate-950 transition disabled:opacity-50 ${
                valid && phase === "challenge"
                  ? "bg-gradient-to-r from-green-400 to-emerald-300 shadow-[0_10px_35px_rgba(34,197,94,0.5)]"
                  : "bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 shadow-[0_10px_35px_rgba(34,211,238,0.35)]"
              }`}
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
