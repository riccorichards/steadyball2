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
  number: number;
  side: Side;
  position: Vec2;
  body_angle: number;
  /** Intro animation: where the player starts before sprinting to `position`. */
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
  };
  passer_id: string;
  carrier_id: string;
  receiver_id: string;
  players: PitchPlayer[];
  validation: {
    zones: Record<string, Zone>;
    /** A pass lane is open when every opponent is at least this far (metres) from it. */
    lane_clearance_m: number;
    /**
     * Each supporter must be on a real diagonal: at least this many degrees below
     * level with the carrier (measured in metres). Stops a flat line of three.
     */
    min_diagonal_deg: number;
  };
  feedback: {
    success_title_ka: string;
    success_text_ka: string;
    failure_ka: string;
  };
  rewards: { elo: number; stats: Record<string, string> };
}

const LESSON: Lesson = {
  lesson_id: "SB_TASK_322_001",
  meta: { target_age_bracket: "U12_U14", puzzle_elo_rating: 1200 },
  context: {
    title_ka: "სამკუთხედის შექმნა წნეხში",
    banner_title_ka: "ჩვენი საყრდენი ხაფანგშია! 🆘",
    banner_text_ka: "შექმენი სამკუთხედი ბურთიანთან (#6), რათა წნეხიდან გამოვიდეს!",
    intro_text_ka: "უყურე სიტუაციას…",
    task_ka: "გადაათრიე #3 და #8 ისე, რომ #6-ს ორივე დიაგონალზე ჰქონდეს თავისუფალი პასის ხაზი.",
  },
  passer_id: "team_4",
  carrier_id: "team_6",
  receiver_id: "team_8",
  players: [
    { id: "team_4", number: 4, side: "team", position: { x: 50, y: 16 }, body_angle: 0 },
    { id: "team_5", number: 5, side: "team", position: { x: 70, y: 18 }, body_angle: 0 },
    { id: "team_6", number: 6, side: "team", position: { x: 50, y: 50 }, body_angle: 180 },
    { id: "team_3", number: 3, side: "team", position: { x: 8, y: 42 }, body_angle: 90, draggable: true },
    { id: "team_8", number: 8, side: "team", position: { x: 67, y: 66 }, body_angle: 200, draggable: true },
    { id: "team_9", number: 9, side: "team", position: { x: 50, y: 86 }, body_angle: 180 },
    { id: "opp_7", number: 7, side: "opponent", position: { x: 42, y: 57 }, body_angle: 135, intro_from: { x: 30, y: 76 } },
    { id: "opp_11", number: 11, side: "opponent", position: { x: 58.5, y: 57.5 }, body_angle: 225, intro_from: { x: 72, y: 78 } },
    { id: "opp_10", number: 10, side: "opponent", position: { x: 50, y: 67 }, body_angle: 180 },
  ],
  validation: {
    zones: {
      team_8: { min_x: 62, max_x: 72, min_y: 38, max_y: 52 },
      team_3: { min_x: 28, max_x: 38, min_y: 38, max_y: 52 },
    },
    lane_clearance_m: 2.5,
    min_diagonal_deg: 20,
  },
  feedback: {
    success_title_ka: "ბრწყინვალე სამკუთხედი! 📐✨",
    success_text_ka:
      "შენ საყრდენს 2 დიაგონალური ვარიანტი გაუხსენი. კრუიფის წესი: ბურთიანთან ყოველთვის უნდა იყოს სამკუთხედი!",
    failure_ka:
      "საყრდენს ჯერ კიდევ არ აქვს 2 თავისუფალი პასის ხაზი! მოიყვანე მოთამაშეები უფრო ახლოს დიაგონალებზე.",
  },
  rewards: { elo: 25, stats: { POS: "+3", SPC: "+2" } },
};

/* ============================================================================
 * 2. GEOMETRY
 *    JSON: X 0 = left, 100 = right · Y 0 = own goal (bottom), 100 = opponent goal (top)
 *    SVG : svgY = 100 - jsonY, scaled vertically to a real pitch shape
 * ========================================================================== */

const PITCH_W = 100;
const PITCH_H = 150;
const Y_SCALE = PITCH_H / 100;
const PAD = 5;
const PLAYER_R = 4;
const INTRO_MS = 1500;
const PITCH_WIDTH_M = 68;
const PITCH_LENGTH_M = 105;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const toSvg = (p: Vec2): Vec2 => ({ x: (p.x / 100) * PITCH_W, y: (100 - p.y) * Y_SCALE });

const fromSvg = (x: number, y: number): Vec2 => ({
  x: clamp((x / PITCH_W) * 100, 2, 98),
  y: clamp(100 - y / Y_SCALE, 2, 98),
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

/** Point `dist` SVG units away from origin in a body-angle direction. */
const offsetAlong = (origin: Vec2, angleDeg: number, dist: number): Vec2 => {
  const r = (angleDeg * Math.PI) / 180;
  return { x: origin.x + Math.sin(r) * dist, y: origin.y - Math.cos(r) * dist };
};

/* ============================================================================
 * 3. AUDIO — short synthesized crowd cheer
 * ========================================================================== */

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

const createAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  return Ctor ? new Ctor() : null;
};

const playCheer = (ctx: AudioContext): void => {
  const duration = 2.4;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(750, t);
  band.frequency.linearRampToValueAtTime(1100, t + 0.6);
  band.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.3, t + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(band).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + duration);
};

/* ============================================================================
 * 4. SVG PIECES
 * ========================================================================== */

const PitchMarkings: React.FC = () => {
  const line = { stroke: "rgba(255,255,255,0.85)", strokeWidth: 0.45, fill: "none" } as const;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={-PAD} y={-PAD} width={PITCH_W + PAD * 2} height={PITCH_H + PAD * 2} fill="#0f2e19" />
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
      <circle cx={50} cy={PITCH_H / 2} r={0.7} fill="rgba(255,255,255,0.9)" />

      <rect x={20.35} y={0} width={59.3} height={23.6} {...line} />
      <rect x={36.55} y={0} width={26.9} height={7.9} {...line} />
      <circle cx={50} cy={15.7} r={0.6} fill="rgba(255,255,255,0.9)" />
      <path d="M 39.3 23.6 A 13.3 13.3 0 0 0 60.7 23.6" {...line} />
      <rect x={44.6} y={-2.4} width={10.8} height={2.4} {...line} strokeWidth={0.6} />

      <rect x={20.35} y={PITCH_H - 23.6} width={59.3} height={23.6} {...line} />
      <rect x={36.55} y={PITCH_H - 7.9} width={26.9} height={7.9} {...line} />
      <circle cx={50} cy={PITCH_H - 15.7} r={0.6} fill="rgba(255,255,255,0.9)" />
      <path d={`M 39.3 ${PITCH_H - 23.6} A 13.3 13.3 0 0 1 60.7 ${PITCH_H - 23.6}`} {...line} />
      <rect x={44.6} y={PITCH_H} width={10.8} height={2.4} {...line} strokeWidth={0.6} />
    </g>
  );
};

interface TokenProps {
  number: number;
  side: Side;
  angle: number;
  carrier?: boolean;
}

/** A player disc: bold number only, no text labels underneath. */
const PlayerToken: React.FC<TokenProps> = ({ number, side, angle, carrier = false }) => {
  const fill = side === "team" ? "#0ea5e9" : "#be123c";
  const stroke = side === "team" ? "#082f49" : "#4c0519";
  const pointer = side === "team" ? "#7dd3fc" : "#fda4af";
  return (
    <g style={{ pointerEvents: "none" }}>
      <ellipse cx={0} cy={PLAYER_R * 0.95} rx={PLAYER_R * 0.9} ry={1.1} fill="rgba(0,0,0,0.35)" />
      {carrier && (
        <>
          <motion.circle
            r={PLAYER_R + 2.2}
            fill="none"
            stroke="#facc15"
            strokeWidth={0.7}
            filter="url(#glow)"
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <path
            d={`M -2.4 ${-PLAYER_R - 2.2} L -2.4 ${-PLAYER_R - 4.6} L -1.2 ${-PLAYER_R - 3.4} L 0 ${-PLAYER_R - 5.4} L 1.2 ${-PLAYER_R - 3.4} L 2.4 ${-PLAYER_R - 4.6} L 2.4 ${-PLAYER_R - 2.2} Z`}
            fill="#facc15"
            stroke="#713f12"
            strokeWidth={0.25}
            filter="url(#glow)"
          />
        </>
      )}
      <g transform={`rotate(${angle})`}>
        <polygon
          points={`0,${-PLAYER_R - 2} -1.3,${-PLAYER_R - 0.2} 1.3,${-PLAYER_R - 0.2}`}
          fill={carrier ? "#facc15" : pointer}
        />
      </g>
      <circle r={PLAYER_R} fill={fill} stroke={carrier ? "#facc15" : stroke} strokeWidth={carrier ? 0.9 : 0.8} />
      <text
        y={1.35}
        textAnchor="middle"
        fontSize={3.9}
        fontWeight={900}
        fill="#ffffff"
        fontFamily="ui-sans-serif, system-ui"
      >
        {number}
      </text>
    </g>
  );
};

/** Floating "DRAG ME" badge with pulsing arrows around a draggable player. */
const DragHint: React.FC = () => (
  <g style={{ pointerEvents: "none" }}>
    {[0, 90, 180, 270].map((deg, i) => (
      <g key={deg} transform={`rotate(${deg})`}>
        <motion.polygon
          points={`0,${-PLAYER_R - 3.6} -1.2,${-PLAYER_R - 2.3} 1.2,${-PLAYER_R - 2.3}`}
          fill="#67e8f9"
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
        />
      </g>
    ))}
    <motion.g animate={{ y: [0, -1.2, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}>
      <g transform={`translate(0 ${-PLAYER_R - 7.6})`}>
        <rect x={-7.2} y={-2.4} width={14.4} height={4.8} rx={2.4} fill="#22d3ee" filter="url(#glow)" />
        <text
          y={0.85}
          textAnchor="middle"
          fontSize={2.4}
          fontWeight={900}
          fill="#082f49"
          fontFamily="ui-sans-serif, system-ui"
          letterSpacing={0.2}
        >
          DRAG ME
        </text>
      </g>
    </motion.g>
  </g>
);

/* ============================================================================
 * 5. VICTORY MODAL
 * ========================================================================== */

const STAT_LABELS_KA: Record<string, string> = {
  POS: "პოზიციონირება",
  SPC: "სივრცის აღქმა",
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
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const dist = 70 + (i % 3) * 20;
            return (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{ backgroundColor: ["#22c55e", "#22d3ee", "#facc15"][i % 3] }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist, opacity: 0, scale: 1.2 }}
                transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
              />
            );
          })}
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

        <div className="mt-3 grid grid-cols-2 gap-2">
          {Object.entries(stats).map(([key, value], i) => (
            <motion.div
              key={key}
              className="rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-400/15 to-transparent px-2 py-2.5 text-center"
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.7 + i * 0.15 }}
            >
              <div className="text-lg font-black text-cyan-300">{value}</div>
              <div className="text-xs font-extrabold tracking-wider text-white">{key}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">{STAT_LABELS_KA[key] ?? key}</div>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-slate-300">{text}</p>

        <motion.button
          type="button"
          onClick={onReplay}
          whileTap={{ scale: 0.97 }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 via-green-400 to-cyan-400 py-4 text-base font-extrabold text-slate-900 shadow-[0_8px_30px_rgba(34,197,94,0.4)]"
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

type Phase = "intro" | "challenge" | "passing" | "success";

export default function PassingTrianglePage(): React.JSX.Element {
  const lesson = LESSON;
  const byId = (id: string): PitchPlayer => {
    const p = lesson.players.find((pl) => pl.id === id);
    if (!p) throw new Error(`Unknown player ${id}`);
    return p;
  };
  const passer = byId(lesson.passer_id);
  const carrier = byId(lesson.carrier_id);
  const receiver = byId(lesson.receiver_id);
  const draggableIds = lesson.players.filter((p) => p.draggable).map((p) => p.id);
  const opponents = lesson.players.filter((p) => p.side === "opponent");

  const initialPositions = (): Record<string, Vec2> =>
    Object.fromEntries(lesson.players.filter((p) => p.draggable).map((p) => [p.id, p.position]));

  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [positions, setPositions] = useState<Record<string, Vec2>>(initialPositions);
  const [moved, setMoved] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [toastId, setToastId] = useState<number | null>(null);
  const [failId, setFailId] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragOffset = useRef<Vec2>({ x: 0, y: 0 });
  const audioRef = useRef<AudioContext | null>(null);
  const timeouts = useRef<number[]>([]);
  const shake = useAnimationControls();

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
  const carrierPos = carrier.position;
  const laneOpen = (target: Vec2): boolean =>
    opponents.every((o) => distanceToSegmentM(o.position, carrierPos, target) >= lesson.validation.lane_clearance_m);

  /** Degrees the supporter sits below level with the carrier (positive = behind). */
  const diagonalDeg = (target: Vec2): number => {
    const c = toMetres(carrierPos);
    const t = toMetres(target);
    return (Math.atan2(c.y - t.y, Math.abs(t.x - c.x)) * 180) / Math.PI;
  };

  const checks = draggableIds.map((id) => {
    const pos = positions[id];
    const zone = lesson.validation.zones[id];
    return {
      id,
      inZone: zone ? inZone(pos, zone) : false,
      laneOpen: laneOpen(pos),
      diagonal: diagonalDeg(pos) >= lesson.validation.min_diagonal_deg,
    };
  });
  const triangleValid = checks.every((c) => c.inZone && c.laneOpen && c.diagonal);

  /* ---------- Dragging ---------- */
  /** Screen → SVG units from the element's box and the viewBox ("meet" scaling). */
  const getSvgPoint = useCallback((clientX: number, clientY: number): Vec2 | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vbW = PITCH_W + PAD * 2;
    const vbH = PITCH_H + PAD * 2;
    const scale = Math.min(rect.width / vbW, rect.height / vbH);
    if (!scale) return null;
    const offX = (rect.width - vbW * scale) / 2;
    const offY = (rect.height - vbH * scale) / 2;
    return {
      x: (clientX - rect.left - offX) / scale - PAD,
      y: (clientY - rect.top - offY) / scale - PAD,
    };
  }, []);

  const beginDrag = (e: React.PointerEvent<SVGElement>, id: string): void => {
    if (phase !== "challenge") return;
    e.preventDefault();
    e.stopPropagation();
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    const s = toSvg(positions[id]);
    dragOffset.current = { x: p.x - s.x, y: p.y - s.y };
    svgRef.current?.setPointerCapture(e.pointerId);
    setDragId(id);
    setMoved((m) => ({ ...m, [id]: true }));
    setToastId(null);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!dragId || phase !== "challenge") return;
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setPositions((prev) => ({ ...prev, [dragId]: fromSvg(p.x - dragOffset.current.x, p.y - dragOffset.current.y) }));
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    setDragId(null);
  };

  /* ---------- Confirm ---------- */
  const ensureAudio = (): void => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    if (audioRef.current?.state === "suspended") audioRef.current.resume().catch(() => undefined);
  };

  const handleConfirm = (): void => {
    if (phase !== "challenge") return;
    ensureAudio();
    setAttempts((n) => n + 1);

    if (!triangleValid) {
      setToastId(Date.now());
      setFailId((n) => n + 1);
      shake.start({ x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.5 } });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([60, 40, 60]);
      return;
    }

    setToastId(null);
    setPhase("passing");
    const t = window.setTimeout(() => {
      setPhase("success");
      if (soundOn && audioRef.current) playCheer(audioRef.current);
    }, 1600);
    timeouts.current.push(t);
  };

  const replay = (): void => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    setPositions(initialPositions());
    setMoved({});
    setDragId(null);
    setAttempts(0);
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
  const passerSvg = toSvg(passer.position);
  const carrierSvg = toSvg(carrier.position);
  const ballAtPasser = offsetAlong(passerSvg, passer.body_angle, PLAYER_R + 1.6);
  const ballAtCarrier = offsetAlong(carrierSvg, carrier.body_angle, PLAYER_R + 1.6);
  const receiverSvg = toSvg(positions[receiver.id] ?? receiver.position);
  const RUN_UP = 6;
  const ballAtReceiver = offsetAlong(receiverSvg, 0, PLAYER_R + 1.6);

  const passingOrDone = phase === "passing" || phase === "success";
  const ballAnimate = passingOrDone
    ? {
        x: [ballAtCarrier.x, ballAtReceiver.x, ballAtReceiver.x],
        y: [ballAtCarrier.y, ballAtReceiver.y, ballAtReceiver.y - RUN_UP],
      }
    : { x: ballAtCarrier.x, y: ballAtCarrier.y };
  const ballTransition = passingOrDone
    ? { duration: 1.4, times: [0, 0.55, 1], ease: "easeOut" as const }
    : { delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  const trianglePts = [carrierSvg, toSvg(positions.team_8 ?? carrier.position), toSvg(positions.team_3 ?? carrier.position)];
  const edges: [Vec2, Vec2][] = [
    [trianglePts[0], trianglePts[1]],
    [trianglePts[0], trianglePts[2]],
    [trianglePts[1], trianglePts[2]],
  ];
  const showTriangle = phase !== "intro";
  const showZoneHints = attempts > 0 && phase === "challenge";

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
            <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/10">
              <svg
                key={runId}
                ref={svgRef}
                viewBox={`${-PAD} ${-PAD} ${PITCH_W + PAD * 2} ${PITCH_H + PAD * 2}`}
                preserveAspectRatio="xMidYMid meet"
                className="h-full w-full select-none bg-[#0f2e19]"
                style={{ touchAction: "none" }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.9" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* userSpaceOnUse: a bounding-box filter clips perfectly horizontal/vertical lines */}
                  <filter
                    id="neon"
                    filterUnits="userSpaceOnUse"
                    x={-PAD}
                    y={-PAD}
                    width={PITCH_W + PAD * 2}
                    height={PITCH_H + PAD * 2}
                  >
                    <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#22c55e" floodOpacity="0.9" />
                  </filter>
                </defs>

                <PitchMarkings />

                {/* Zone hints appear only after a wrong attempt */}
                {showZoneHints &&
                  Object.values(lesson.validation.zones).map((z, i) => {
                    const tl = toSvg({ x: z.min_x, y: z.max_y });
                    const br = toSvg({ x: z.max_x, y: z.min_y });
                    return (
                      <motion.rect
                        key={i}
                        x={tl.x}
                        y={tl.y}
                        width={br.x - tl.x}
                        height={br.y - tl.y}
                        rx={1.2}
                        fill="rgba(34,211,238,0.07)"
                        stroke="#22d3ee"
                        strokeWidth={0.45}
                        strokeDasharray="2 1.4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{ pointerEvents: "none" }}
                      />
                    );
                  })}

                {/* Live triangle */}
                {showTriangle && (
                  <g style={{ pointerEvents: "none" }}>
                    {triangleValid && (
                      <motion.polygon
                        points={trianglePts.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill="#22c55e"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.08, 0.2, 0.08] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                      />
                    )}
                    {edges.map(([a, b], i) =>
                      triangleValid ? (
                        <motion.line
                          key={`v${i}`}
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="#22c55e"
                          strokeLinecap="round"
                          filter="url(#neon)"
                          initial={{ strokeWidth: 1.4 }}
                          animate={{ strokeWidth: [0.7, 1.1, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        />
                      ) : (
                        <line
                          key={`i${i}`}
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="rgba(226,232,240,0.4)"
                          strokeWidth={0.4}
                          strokeDasharray="1.4 1.2"
                        />
                      )
                    )}
                  </g>
                )}

                {/* Players */}
                {lesson.players.map((p) => {
                  if (p.draggable) return null;
                  const end = toSvg(p.position);
                  const start = toSvg(p.intro_from ?? p.position);
                  const isCarrier = p.id === carrier.id && !passingOrDone;
                  return (
                    <motion.g
                      key={p.id}
                      initial={{ x: start.x, y: start.y }}
                      animate={{ x: end.x, y: end.y }}
                      transition={{ delay: 0.5, duration: 0.9, ease: [0.3, 0, 0.2, 1] }}
                    >
                      <PlayerToken number={p.number} side={p.side} angle={p.body_angle} carrier={isCarrier} />
                    </motion.g>
                  );
                })}

                {/* Draggable supporters (#3, #8) */}
                {draggableIds.map((id) => {
                  const p = byId(id);
                  const s = toSvg(positions[id]);
                  const isReceiver = id === receiver.id;
                  const faceAngle = isReceiver && passingOrDone ? 0 : bearingDeg(positions[id], carrierPos);
                  const canDrag = phase === "challenge";
                  return (
                    <motion.g
                      key={id}
                      animate={isReceiver && passingOrDone ? { y: [0, 0, -RUN_UP] } : { y: 0 }}
                      transition={isReceiver && passingOrDone ? { duration: 1.4, times: [0, 0.55, 1] } : { duration: 0 }}
                    >
                      <g transform={`translate(${s.x} ${s.y})`}>
                        <PlayerToken
                          number={p.number}
                          side="team"
                          angle={faceAngle}
                          carrier={isReceiver && phase === "success"}
                        />
                        {canDrag && !moved[id] && <DragHint />}
                        <circle
                          r={PLAYER_R + 3}
                          fill="transparent"
                          style={{
                            cursor: canDrag ? (dragId === id ? "grabbing" : "grab") : "default",
                            pointerEvents: canDrag ? "auto" : "none",
                          }}
                          onPointerDown={(e) => beginDrag(e, id)}
                        />
                      </g>
                    </motion.g>
                  );
                })}

                {/* Ball */}
                <motion.g
                  initial={{ x: ballAtPasser.x, y: ballAtPasser.y }}
                  animate={ballAnimate}
                  transition={ballTransition}
                  style={{ pointerEvents: "none" }}
                >
                  <ellipse cx={0.3} cy={1.4} rx={1.5} ry={0.55} fill="rgba(0,0,0,0.4)" />
                  <circle r={1.6} fill="#ffffff" stroke="#0f172a" strokeWidth={0.3} />
                  <polygon points="0,-0.65 0.62,-0.2 0.38,0.53 -0.38,0.53 -0.62,-0.2" fill="#0f172a" />
                </motion.g>
              </svg>

              {/* Freeze overlay: blurred edges, clear centre where the task happens */}
              <AnimatePresence>
                {phase === "challenge" && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                    style={{
                      WebkitMaskImage: "radial-gradient(ellipse 62% 30% at 50% 53%, transparent 55%, black 100%)",
                      maskImage: "radial-gradient(ellipse 62% 30% at 50% 53%, transparent 55%, black 100%)",
                    }}
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
                    className="absolute left-3 right-3 top-3 z-20 flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-950/80 p-3 shadow-2xl backdrop-blur-xl"
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
                triangleValid && phase === "challenge"
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
