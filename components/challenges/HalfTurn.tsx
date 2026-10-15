"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationControls,
} from "framer-motion";
import {
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import ChallengeEndActions from "@/components/ChallengeEndActions";

/* ============================================================================
 * 1. DATA SCHEMA (types + lesson payload)
 * ========================================================================== */

interface Vec2 {
  x: number;
  y: number;
}

interface UserAvatar {
  id: string;
  role: string;
  display_number: number;
  current_position: Vec2;
  current_body_angle: number;
}

interface Teammate {
  id: string;
  role: string;
  display_number: number;
  position: Vec2;
  body_angle: number;
  has_ball: boolean;
}

interface Opponent {
  id: string;
  role: string;
  display_number: number;
  position: Vec2;
  body_angle: number;
  has_cover_shadow?: boolean;
}

interface Ball {
  position: Vec2;
  holder_id: string;
}

interface TargetZone {
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
}

/**
 * Half-turn rule: the body angle is valid when BOTH the ball and the opponent
 * goal sit within `max_offset_deg` of where the chest points. The correct angle
 * is derived from where the players stand, so no per-lesson degree value is needed.
 */
interface BodyOrientationRule {
  mode: "open_to_ball_and_goal";
  max_offset_deg: number;
}

interface Lesson {
  lesson_id: string;
  meta: {
    target_role: string;
    target_age_bracket: string;
    puzzle_elo_rating: number;
  };
  tactical_context: {
    scenario_title_ka: string;
    scenario_prompt_ka: string;
  };
  pitch_entities: {
    user_avatar: UserAvatar;
    teammates: Teammate[];
    opponents: Opponent[];
    ball: Ball;
  };
  interactive_task: {
    validation_rules: {
      target_zone: TargetZone;
      body_orientation: BodyOrientationRule;
    };
  };
  pedagogical_feedback: {
    success: { title_ka: string; explanation_ka: string };
    failure_wrong_position: { title_ka: string; hint_ka: string };
    failure_wrong_angle: { title_ka: string; hint_ka: string };
  };
  rewards: {
    base_elo: number;
    speed_bonus_elo: number;
    stats: Record<string, string>;
  };
}

const LESSON: Lesson = {
  lesson_id: "SB_TASK_321_001",
  meta: {
    target_role: "CM_8",
    target_age_bracket: "U12_U14",
    puzzle_elo_rating: 1150,
  },
  tactical_context: {
    scenario_title_ka: "გახსენი ხედვის კუთხე!",
    scenario_prompt_ka:
      "ჩვენი მცველი ბურთით ამოდის. შენ მეტოქის საყრდენის ჩრდილში დგახარ, ზურგით კარისკენ! გადაიტანე ავატარი მარჯვენა ნახევარსივრცეში და გახსენი სხეული ისე, რომ ერთდროულად ხედავდე ბურთს (#4) და მეტოქის კარს (Half-Turn).",
  },
  pitch_entities: {
    user_avatar: {
      id: "player_user",
      role: "CM",
      display_number: 8,
      current_position: { x: 52, y: 56 },
      current_body_angle: 180,
    },
    teammates: [
      { id: "team_cb", role: "CB", display_number: 4, position: { x: 42, y: 20 }, body_angle: 0, has_ball: true },
      { id: "team_cf", role: "CF", display_number: 9, position: { x: 50, y: 85 }, body_angle: 180, has_ball: false },
    ],
    opponents: [
      { id: "opp_dmf", role: "DM", display_number: 6, position: { x: 50, y: 48 }, body_angle: 180, has_cover_shadow: true },
      { id: "opp_cb", role: "CB", display_number: 5, position: { x: 48, y: 75 }, body_angle: 180 },
    ],
    ball: { position: { x: 42, y: 20 }, holder_id: "team_cb" },
  },
  interactive_task: {
    validation_rules: {
      target_zone: { min_x: 66, max_x: 78, min_y: 42, max_y: 52 },
      body_orientation: { mode: "open_to_ball_and_goal", max_offset_deg: 95 },
    },
  },
  pedagogical_feedback: {
    success: {
      title_ka: "ბრწყინვალე პოზიციონირება! 🧭",
      explanation_ka:
        "შენ გამოხვედი საყრდენის ჩრდილიდან და სხეული გახსენი: ერთდროულად ხედავ ბურთს და მეტოქის კარს. ახლა ერთი შეხებით შეგიძლია ბურთის საჯარიმოსკენ წაღება!",
    },
    failure_wrong_position: {
      title_ka: "მეტოქის ჩრდილში ხარ!",
      hint_ka: "გადადი მარჯვენა ნახევარსივრცეში (Half-Space) მონიშნულ ზონაში!",
    },
    failure_wrong_angle: {
      title_ka: "სხეული ისევ დახურულია!",
      hint_ka: "პოზიცია სწორია, მაგრამ სხეული ისე გახსენი, რომ ერთდროულად ხედავდე ბურთს (#4) და მეტოქის კარს!",
    },
  },
  rewards: {
    base_elo: 20,
    speed_bonus_elo: 10,
    stats: { PRS: "+3", POS: "+2", SCN: "+1" },
  },
};

/* ============================================================================
 * 2. GEOMETRY — normalized pitch (0-100) ⇄ SVG user units
 *    JSON: X 0 = left sideline, Y 0 = own goal (bottom), Y 100 = opponent goal (top)
 *    SVG : Y 0 is the top → svgY = 100 - jsonY, then scaled to a real pitch aspect
 * ========================================================================== */

const PITCH_W = 100;
const PITCH_H = 150;
const Y_SCALE = PITCH_H / 100;
const PAD = 5;
/** Area of the pitch this puzzle needs on screen (SVG units). Extra screen space shows more pitch around it. */
const CAMERA = { x: 10, y: 12, w: 80, h: 120 };
const SPEED_BONUS_WINDOW_MS = 10_000;
const PLAYER_R = 4.2;
const RING_R = 8.5;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const toSvg = (p: Vec2): Vec2 => ({
  x: (p.x / 100) * PITCH_W,
  y: (100 - p.y) * Y_SCALE,
});

const fromSvg = (x: number, y: number): Vec2 => ({
  x: clamp((x / PITCH_W) * 100, 0, 100),
  y: clamp(100 - y / Y_SCALE, 0, 100),
});

const normalizeAngle = (a: number): number => ((a % 360) + 360) % 360;

const angularDistance = (a: number, b: number): number =>
  Math.abs(((a - b + 540) % 360) - 180);

/* Real pitch size, used so angles are measured in metres, not stretched 0-100 units. */
const PITCH_WIDTH_M = 68;
const PITCH_LENGTH_M = 105;
const OPP_GOAL: Vec2 = { x: 50, y: 100 };

/** Bearing from `from` to `to` in pitch metres. 0° = toward opponent goal, 90° = right. */
const bearingDeg = (from: Vec2, to: Vec2): number => {
  const dx = ((to.x - from.x) / 100) * PITCH_WIDTH_M;
  const dy = ((to.y - from.y) / 100) * PITCH_LENGTH_M;
  return normalizeAngle((Math.atan2(dx, dy) * 180) / Math.PI);
};

/** 0° = up (opponent goal), 90° = right, 180° = down (own goal). */
const offsetAlong = (origin: Vec2, angleDeg: number, dist: number): Vec2 => {
  const r = (angleDeg * Math.PI) / 180;
  return { x: origin.x + Math.sin(r) * dist, y: origin.y - Math.cos(r) * dist };
};

const formatTimer = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(total / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  const millis = total % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
};

/* ============================================================================
 * 3. AUDIO — synthesized stadium roar (no external assets)
 * ========================================================================== */

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

const createAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  return Ctor ? new Ctor() : null;
};

const playStadiumRoar = (ctx: AudioContext): void => {
  const duration = 2.8;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  const crowd = ctx.createBufferSource();
  crowd.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(700, t);
  band.frequency.linearRampToValueAtTime(1100, t + 0.6);
  band.Q.value = 0.6;
  const crowdGain = ctx.createGain();
  crowdGain.gain.setValueAtTime(0.0001, t);
  crowdGain.gain.exponentialRampToValueAtTime(0.32, t + 0.45);
  crowdGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  crowd.connect(band).connect(crowdGain).connect(ctx.destination);
  crowd.start(t);
  crowd.stop(t + duration);

  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const start = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.1, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
};

/* ============================================================================
 * 4. SVG SUB-COMPONENTS
 * ========================================================================== */

const PitchMarkings: React.FC = () => {
  const line = { stroke: "rgba(255,255,255,0.85)", strokeWidth: 0.45, fill: "none" } as const;
  const stripes = Array.from({ length: 10 }, (_, i) => i);
  return (
    <g>
      <rect x={-PAD} y={-PAD} width={PITCH_W + PAD * 2} height={PITCH_H + PAD * 2} fill="#13381e" />
      {stripes.map((i) => (
        <rect
          key={i}
          x={0}
          y={i * (PITCH_H / 10)}
          width={PITCH_W}
          height={PITCH_H / 10}
          fill={i % 2 === 0 ? "#1a472a" : "#164024"}
        />
      ))}
      <rect x={0} y={0} width={PITCH_W} height={PITCH_H} {...line} />
      <line x1={0} y1={PITCH_H / 2} x2={PITCH_W} y2={PITCH_H / 2} {...line} />
      <circle cx={50} cy={PITCH_H / 2} r={13.3} {...line} />
      <circle cx={50} cy={PITCH_H / 2} r={0.7} fill="rgba(255,255,255,0.9)" />

      {/* Opponent end (top) */}
      <rect x={20.35} y={0} width={59.3} height={23.6} {...line} />
      <rect x={36.55} y={0} width={26.9} height={7.9} {...line} />
      <circle cx={50} cy={15.7} r={0.6} fill="rgba(255,255,255,0.9)" />
      <path d="M 39.3 23.6 A 13.3 13.3 0 0 0 60.7 23.6" {...line} />
      <rect x={44.6} y={-2.4} width={10.8} height={2.4} {...line} strokeWidth={0.6} />

      {/* Own end (bottom) */}
      <rect x={20.35} y={PITCH_H - 23.6} width={59.3} height={23.6} {...line} />
      <rect x={36.55} y={PITCH_H - 7.9} width={26.9} height={7.9} {...line} />
      <circle cx={50} cy={PITCH_H - 15.7} r={0.6} fill="rgba(255,255,255,0.9)" />
      <path d={`M 39.3 ${PITCH_H - 23.6} A 13.3 13.3 0 0 1 60.7 ${PITCH_H - 23.6}`} {...line} />
      <rect x={44.6} y={PITCH_H} width={10.8} height={2.4} {...line} strokeWidth={0.6} />

      {/* Corner arcs */}
      <path d="M 0 1.5 A 1.5 1.5 0 0 0 1.5 0" {...line} />
      <path d={`M ${PITCH_W - 1.5} 0 A 1.5 1.5 0 0 0 ${PITCH_W} 1.5`} {...line} />
      <path d={`M 0 ${PITCH_H - 1.5} A 1.5 1.5 0 0 1 1.5 ${PITCH_H}`} {...line} />
      <path d={`M ${PITCH_W - 1.5} ${PITCH_H} A 1.5 1.5 0 0 1 ${PITCH_W} ${PITCH_H - 1.5}`} {...line} />
    </g>
  );
};

interface StaticPlayerProps {
  position: Vec2;
  angle: number;
  number: number;
  role: string;
  fill: string;
  stroke: string;
}

const StaticPlayer: React.FC<StaticPlayerProps> = ({ position, angle, number, role, fill, stroke }) => {
  const p = toSvg(position);
  return (
    <g transform={`translate(${p.x} ${p.y})`} style={{ pointerEvents: "none" }}>
      <ellipse cx={0} cy={PLAYER_R * 0.9} rx={PLAYER_R * 0.9} ry={1.1} fill="rgba(0,0,0,0.35)" />
      <g transform={`rotate(${angle})`}>
        <polygon points={`0,${-PLAYER_R - 2.2} -1.4,${-PLAYER_R - 0.2} 1.4,${-PLAYER_R - 0.2}`} fill={stroke} />
      </g>
      <circle r={PLAYER_R} fill={fill} stroke={stroke} strokeWidth={0.7} />
      <text
        y={1.25}
        textAnchor="middle"
        fontSize={3.6}
        fontWeight={800}
        fill="#ffffff"
        fontFamily="ui-sans-serif, system-ui"
      >
        {number}
      </text>
      <text
        y={PLAYER_R + 3.8}
        textAnchor="middle"
        fontSize={2.3}
        fontWeight={700}
        fill="rgba(255,255,255,0.75)"
        fontFamily="ui-sans-serif, system-ui"
        letterSpacing={0.2}
      >
        {role}
      </text>
    </g>
  );
};

/* ============================================================================
 * 5. VICTORY MODAL
 * ========================================================================== */

const STAT_LABELS_KA: Record<string, string> = {
  PRS: "პრესინგის წინააღმდეგობა",
  POS: "პოზიციონირება",
  SCN: "სკანირება",
};

interface VictoryModalProps {
  reactionMs: number;
  baseElo: number;
  speedBonus: number;
  stats: Record<string, string>;
  title: string;
  explanation: string;
  soundOn: boolean;
  onToggleSound: () => void;
  onNext: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({
  reactionMs,
  baseElo,
  speedBonus,
  stats,
  title,
  explanation,
  soundOn,
  onToggleSound,
  onNext,
}) => {
  const totalElo = baseElo + speedBonus;
  const [eloDisplay, setEloDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, totalElo, {
      duration: 1.3,
      delay: 0.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setEloDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [totalElo]);

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 70 + (i % 3) * 22;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          color: ["#facc15", "#22d3ee", "#34d399", "#f472b6"][i % 4],
        };
      }),
    []
  );

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 p-6 shadow-[0_0_60px_rgba(34,211,238,0.25)]"
        initial={{ scale: 0.6, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

        <button
          type="button"
          onClick={onToggleSound}
          aria-label="stadium sound"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.2 }}
              transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
            />
          ))}
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

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Timer className="h-3.5 w-3.5" /> რეაქცია
            </div>
            <div className="mt-1 font-mono text-2xl font-black text-white">
              {(reactionMs / 1000).toFixed(1)} წმ
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> რეიტინგი
            </div>
            <motion.div
              className="mt-1 font-mono text-2xl font-black text-emerald-300"
              initial={{ scale: 0.6 }}
              animate={{ scale: [0.6, 1.15, 1] }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              +{eloDisplay} ELO
            </motion.div>
            {speedBonus > 0 && (
              <div className="mt-0.5 text-[10px] font-semibold text-emerald-200/80">
                +{baseElo} ბაზა · +{speedBonus} სისწრაფე
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
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
              <div className="mt-0.5 text-[9px] leading-tight text-slate-400">{STAT_LABELS_KA[key] ?? key}</div>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-slate-300">{explanation}</p>

        <ChallengeEndActions onReplay={onNext} />
      </motion.div>
    </motion.div>
  );
};

/* ============================================================================
 * 6. MAIN PAGE
 * ========================================================================== */

type GameStatus = "playing" | "passing" | "success";
type DragMode = "move" | "rotate" | null;
type FailureKind = "position" | "angle";

interface ToastState {
  kind: FailureKind;
  id: number;
}

export default function TacticalPuzzlePage(): React.JSX.Element {
  const lesson = LESSON;
  const { user_avatar, teammates, opponents, ball } = lesson.pitch_entities;
  const rules = lesson.interactive_task.validation_rules;

  const [avatarPos, setAvatarPos] = useState<Vec2>(user_avatar.current_position);
  const [bodyAngle, setBodyAngle] = useState<number>(user_avatar.current_body_angle);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [finalMs, setFinalMs] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [failFlashId, setFailFlashId] = useState<number>(0);
  const [promptOpen, setPromptOpen] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const startRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<Vec2>({ x: 0, y: 0 });
  const audioRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const shakeControls = useAnimationControls();

  /* ---------- Reaction timer ---------- */
  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    let raf = 0;
    const tick = (): void => {
      if (startRef.current !== null) setElapsedMs(performance.now() - startRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      audioRef.current?.close().catch(() => undefined);
    };
  }, []);

  /* ---------- Toast auto-dismiss ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ---------- Derived geometry ---------- */
  const avatarSvg = toSvg(avatarPos);
  const zone = rules.target_zone;
  const zoneTopLeft = toSvg({ x: zone.min_x, y: zone.max_y });
  const zoneBottomRight = toSvg({ x: zone.max_x, y: zone.min_y });
  const insideZone =
    avatarPos.x >= zone.min_x && avatarPos.x <= zone.max_x && avatarPos.y >= zone.min_y && avatarPos.y <= zone.max_y;

  const orientation = rules.body_orientation;
  const ballOffset = angularDistance(bodyAngle, bearingDeg(avatarPos, ball.position));
  const goalOffset = angularDistance(bodyAngle, bearingDeg(avatarPos, OPP_GOAL));
  const seesBall = ballOffset <= orientation.max_offset_deg;
  const seesGoal = goalOffset <= orientation.max_offset_deg;

  const fovRad = (orientation.max_offset_deg * Math.PI) / 180;
  const FOV_R = 15;
  const fovPath = `M 0 0 L ${-Math.sin(fovRad) * FOV_R} ${-Math.cos(fovRad) * FOV_R} A ${FOV_R} ${FOV_R} 0 ${
    orientation.max_offset_deg > 90 ? 1 : 0
  } 1 ${Math.sin(fovRad) * FOV_R} ${-Math.cos(fovRad) * FOV_R} Z`;

  const holder = teammates.find((t) => t.id === ball.holder_id);
  const holderSvg = toSvg(holder ? holder.position : ball.position);
  const ballAtHolder = offsetAlong(holderSvg, holder ? holder.body_angle : 0, PLAYER_R + 1.6);
  const ballAtUser = offsetAlong(avatarSvg, bodyAngle, PLAYER_R + 1.6);
  const ballTarget = status === "playing" ? ballAtHolder : ballAtUser;

  const shadowOpponent = opponents.find((o) => o.has_cover_shadow);
  const shadowApex = shadowOpponent ? toSvg(shadowOpponent.position) : null;

  /* Cover shadow: cast from the ball through the opponent and continuing past him. */
  const shadow = (() => {
    if (!shadowApex) return null;
    const src = toSvg(ball.position);
    const vx = shadowApex.x - src.x;
    const vy = shadowApex.y - src.y;
    const len = Math.hypot(vx, vy) || 1;
    const ux = vx / len;
    const uy = vy / len;
    const L = 36;
    const W = 11;
    const end = { x: shadowApex.x + ux * L, y: shadowApex.y + uy * L };
    return {
      path: `M ${shadowApex.x} ${shadowApex.y} L ${end.x - uy * W} ${end.y + ux * W} L ${end.x + uy * W} ${end.y - ux * W} Z`,
      start: shadowApex,
      end,
      label: { x: shadowApex.x + ux * L * 0.82, y: shadowApex.y + uy * L * 0.82 },
    };
  })();

  /* ---------- Pointer helpers ---------- */
  const getSvgPoint = useCallback((clientX: number, clientY: number): Vec2 | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const angleFromPoint = useCallback(
    (p: Vec2): number => {
      const dx = p.x - avatarSvg.x;
      const dy = p.y - avatarSvg.y;
      const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      return Math.round(normalizeAngle(deg));
    },
    [avatarSvg.x, avatarSvg.y]
  );

  const beginDrag = (e: React.PointerEvent<SVGElement>, mode: Exclude<DragMode, null>): void => {
    if (status !== "playing") return;
    e.preventDefault();
    e.stopPropagation();
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    setToast(null);
    if (mode === "move") {
      dragOffsetRef.current = { x: p.x - avatarSvg.x, y: p.y - avatarSvg.y };
    } else {
      setBodyAngle(angleFromPoint(p));
    }
    setDragMode(mode);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (!dragMode || status !== "playing") return;
    const p = getSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    if (dragMode === "move") {
      setAvatarPos(fromSvg(p.x - dragOffsetRef.current.x, p.y - dragOffsetRef.current.y));
    } else {
      setBodyAngle(angleFromPoint(p));
    }
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>): void => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    setDragMode(null);
  };

  /* ---------- Audio ---------- */
  const ensureAudio = (): void => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    if (audioRef.current?.state === "suspended") {
      audioRef.current.resume().catch(() => undefined);
    }
  };

  const playRoar = (): void => {
    if (audioRef.current) playStadiumRoar(audioRef.current);
  };

  const toggleSound = (): void => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      ensureAudio();
      playRoar();
    }
  };

  /* ---------- Validation ---------- */
  const triggerFailure = (kind: FailureKind): void => {
    setToast({ kind, id: Date.now() });
    setFailFlashId((n) => n + 1);
    shakeControls.start({
      x: [0, -2.6, 2.6, -2, 2, -1, 1, 0],
      transition: { duration: 0.5, ease: "easeInOut" },
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([60, 40, 60]);
    }
  };

  const handleConfirm = (): void => {
    if (status !== "playing") return;
    ensureAudio();
    setAttempts((n) => n + 1);

    const angleOk = seesBall && seesGoal;

    if (!insideZone) {
      triggerFailure("position");
      return;
    }
    if (!angleOk) {
      triggerFailure("angle");
      return;
    }

    const reaction = startRef.current !== null ? performance.now() - startRef.current : elapsedMs;
    setElapsedMs(reaction);
    setFinalMs(reaction);
    setToast(null);
    setStatus("passing");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);

    const t = window.setTimeout(() => {
      setStatus("success");
      if (soundOn) playRoar();
    }, 1050);
    timeoutsRef.current.push(t);
  };

  /* ---------- Reset / next level (single-lesson build restarts the drill) ---------- */
  const resetPuzzle = (): void => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
    setAvatarPos(user_avatar.current_position);
    setBodyAngle(user_avatar.current_body_angle);
    setToast(null);
    setAttempts(0);
    setElapsedMs(0);
    setFinalMs(0);
    setDragMode(null);
    startRef.current = performance.now();
    setStatus("playing");
  };

  const speedBonus = finalMs > 0 && finalMs <= SPEED_BONUS_WINDOW_MS ? lesson.rewards.speed_bonus_elo : 0;
  const interactive = status === "playing";

  const toastContent =
    toast?.kind === "position"
      ? lesson.pedagogical_feedback.failure_wrong_position
      : lesson.pedagogical_feedback.failure_wrong_angle;

  /* ---------- Render ---------- */
  return (
    <div className="h-full w-full bg-slate-950">
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white">
        
        {/* ===== Top bar ===== */}
        <header className="relative z-30 flex items-center justify-between gap-2 px-4 pb-2 pt-2.5">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
            <Timer className={`h-4 w-4 ${interactive ? "text-cyan-300" : "text-emerald-300"}`} />
            <span className="font-mono text-sm font-bold tabular-nums tracking-tight">{formatTimer(elapsedMs)}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200">
            <Target className="h-3.5 w-3.5" />
            {lesson.meta.puzzle_elo_rating}
          </div>

          <motion.button
            type="button"
            onClick={resetPuzzle}
            whileTap={{ rotate: -180, scale: 0.9 }}
            aria-label="reset"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 backdrop-blur-xl"
          >
            <RotateCcw className="h-4 w-4" />
          </motion.button>
        </header>

        {/* ===== Pitch ===== */}
        <section className="relative min-h-0 flex-1 px-3">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                initial={{ y: -30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`absolute left-5 right-5 top-2 z-30 flex items-start gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl ${
                  toast.kind === "position"
                    ? "border-rose-400/40 bg-rose-950/80"
                    : "border-amber-400/40 bg-amber-950/80"
                }`}
              >
                <ShieldAlert
                  className={`mt-0.5 h-5 w-5 shrink-0 ${toast.kind === "position" ? "text-rose-300" : "text-amber-300"}`}
                />
                <div>
                  <p className="text-sm font-extrabold leading-snug">{toastContent.title_ka}</p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-200">{toastContent.hint_ka}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative h-full w-full overflow-hidden rounded-[24px] border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
            <svg
              ref={svgRef}
              viewBox={`${CAMERA.x} ${CAMERA.y} ${CAMERA.w} ${CAMERA.h}`}
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-full select-none bg-[#13381e]"
              style={{ touchAction: "none", cursor: dragMode === "move" ? "grabbing" : "default" }}
              onPointerMove={handlePointerMove}
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
                <radialGradient id="visionCone" cx="0.5" cy="1" r="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </radialGradient>
              </defs>

              <PitchMarkings />

              {/* Five vertical lanes: wings | half-spaces | centre (box edge & goal-area edge) */}
              <g style={{ pointerEvents: "none" }}>
                {[20.35, 36.55, 63.45, 79.65].map((x) => (
                  <line
                    key={x}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={PITCH_H}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={0.3}
                    strokeDasharray="1.5 2"
                  />
                ))}
              </g>

              {/* Opponent goal lights up when #8 can see it */}
              <rect
                x={44.6}
                y={-2.4}
                width={10.8}
                height={2.4}
                fill={seesGoal ? "rgba(34,211,238,0.55)" : "transparent"}
                stroke={seesGoal ? "#22d3ee" : "transparent"}
                strokeWidth={0.6}
                filter={seesGoal ? "url(#glow)" : undefined}
                style={{ pointerEvents: "none", transition: "fill 0.2s" }}
              />

              {/* Cover shadow: from the ball, through #6, continuing past him */}
              {shadow && (
                <g style={{ pointerEvents: "none" }}>
                  <linearGradient
                    id="coverShadowDir"
                    gradientUnits="userSpaceOnUse"
                    x1={shadow.start.x}
                    y1={shadow.start.y}
                    x2={shadow.end.x}
                    y2={shadow.end.y}
                  >
                    <stop offset="0%" stopColor="#020617" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#020617" stopOpacity={0} />
                  </linearGradient>
                  <path d={shadow.path} fill="url(#coverShadowDir)" />
                  <text
                    x={shadow.label.x}
                    y={shadow.label.y}
                    textAnchor="middle"
                    fontSize={2.2}
                    fontWeight={700}
                    fill="rgba(148,163,184,0.55)"
                    letterSpacing={0.4}
                  >
                    COVER SHADOW
                  </text>
                </g>
              )}

              {/* Target zone */}
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={zoneTopLeft.x}
                  y={zoneTopLeft.y}
                  width={zoneBottomRight.x - zoneTopLeft.x}
                  height={zoneBottomRight.y - zoneTopLeft.y}
                  rx={1.2}
                  fill={insideZone ? "rgba(52,211,153,0.18)" : "rgba(34,211,238,0.08)"}
                />
                <motion.rect
                  x={zoneTopLeft.x}
                  y={zoneTopLeft.y}
                  width={zoneBottomRight.x - zoneTopLeft.x}
                  height={zoneBottomRight.y - zoneTopLeft.y}
                  rx={1.2}
                  fill="none"
                  stroke={insideZone ? "#34d399" : "#22d3ee"}
                  strokeWidth={0.55}
                  strokeDasharray="2 1.4"
                  filter="url(#glow)"
                  animate={{ strokeDashoffset: [0, -6.8], opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                />
                <text
                  x={(zoneTopLeft.x + zoneBottomRight.x) / 2}
                  y={zoneTopLeft.y - 1.4}
                  textAnchor="middle"
                  fontSize={2.3}
                  fontWeight={800}
                  fill={insideZone ? "#6ee7b7" : "#67e8f9"}
                  letterSpacing={0.3}
                >
                  HALF-SPACE
                </text>
              </g>

              {/* Pass trail */}
              <AnimatePresence>
                {status !== "playing" && (
                  <motion.line
                    x1={ballAtHolder.x}
                    y1={ballAtHolder.y}
                    x2={ballAtUser.x}
                    y2={ballAtUser.y}
                    stroke="#fde047"
                    strokeWidth={0.6}
                    strokeDasharray="1.6 1.2"
                    strokeLinecap="round"
                    filter="url(#glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.9 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              {/* Passer (#4) lights up when #8 can see him */}
              {holder && seesBall && (
                <circle
                  cx={holderSvg.x}
                  cy={holderSvg.y}
                  r={PLAYER_R + 1.6}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={0.7}
                  filter="url(#glow)"
                  style={{ pointerEvents: "none" }}
                />
              )}

              {/* Teammates & opponents */}
              {teammates.map((t) => (
                <StaticPlayer
                  key={t.id}
                  position={t.position}
                  angle={t.body_angle}
                  number={t.display_number}
                  role={t.role}
                  fill="#0284c7"
                  stroke="#7dd3fc"
                />
              ))}
              {opponents.map((o) => (
                <StaticPlayer
                  key={o.id}
                  position={o.position}
                  angle={o.body_angle}
                  number={o.display_number}
                  role={o.role}
                  fill="#be123c"
                  stroke="#fda4af"
                />
              ))}

              {/* User avatar #8 */}
              <motion.g animate={shakeControls}>
                <g transform={`translate(${avatarSvg.x} ${avatarSvg.y})`}>
                  <motion.circle
                    r={PLAYER_R + 2.4}
                    fill="#22d3ee"
                    style={{ pointerEvents: "none" }}
                    animate={{ opacity: [0.12, 0.3, 0.12], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <AnimatePresence>
                    {failFlashId > 0 && (
                      <motion.circle
                        key={failFlashId}
                        r={PLAYER_R + 1}
                        fill="none"
                        stroke="#fb7185"
                        strokeWidth={0.8}
                        style={{ pointerEvents: "none" }}
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 2.4 }}
                        transition={{ duration: 0.7 }}
                      />
                    )}
                  </AnimatePresence>

                  <g transform={`rotate(${bodyAngle})`}>
                    {/* Field of view (what the player can see without turning) */}
                    <path
                      d={fovPath}
                      fill="rgba(34,211,238,0.07)"
                      stroke="rgba(34,211,238,0.35)"
                      strokeWidth={0.3}
                      strokeDasharray="1 1"
                      style={{ pointerEvents: "none" }}
                    />
                    <path
                      d="M 0 0 L -7 -18 A 19.3 19.3 0 0 1 7 -18 Z"
                      fill="url(#visionCone)"
                      style={{ pointerEvents: "none" }}
                    />
                  </g>

                  {/* Rotation ring (tap or drag to rotate) */}
                  <circle
                    r={RING_R}
                    fill="none"
                    stroke="rgba(34,211,238,0.5)"
                    strokeWidth={0.4}
                    strokeDasharray="1 1"
                    style={{ pointerEvents: "none" }}
                  />
                  <circle
                    r={RING_R}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={4}
                    style={{ cursor: interactive ? "crosshair" : "default", pointerEvents: interactive ? "stroke" : "none" }}
                    onPointerDown={(e) => beginDrag(e, "rotate")}
                  />

                  <circle
                    r={PLAYER_R}
                    fill="#facc15"
                    stroke="#22d3ee"
                    strokeWidth={0.9}
                    filter="url(#glow)"
                    style={{ cursor: interactive ? (dragMode === "move" ? "grabbing" : "grab") : "default" }}
                    onPointerDown={(e) => beginDrag(e, "move")}
                  />

                  <g transform={`rotate(${bodyAngle})`}>
                    <polygon
                      points={`0,${-PLAYER_R - 2.8} -1.8,${-PLAYER_R - 0.3} 1.8,${-PLAYER_R - 0.3}`}
                      fill="#22d3ee"
                      stroke="#ecfeff"
                      strokeWidth={0.3}
                      style={{ pointerEvents: "none" }}
                    />
                    <line
                      x1={0}
                      y1={-PLAYER_R - 2.8}
                      x2={0}
                      y2={-RING_R}
                      stroke="#22d3ee"
                      strokeWidth={0.35}
                      style={{ pointerEvents: "none" }}
                    />
                    <circle
                      cy={-RING_R}
                      r={2}
                      fill="#22d3ee"
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{ cursor: interactive ? "grab" : "default", pointerEvents: interactive ? "auto" : "none" }}
                      onPointerDown={(e) => beginDrag(e, "rotate")}
                    />
                  </g>

                  <text
                    y={1.3}
                    textAnchor="middle"
                    fontSize={3.8}
                    fontWeight={900}
                    fill="#0f172a"
                    fontFamily="ui-sans-serif, system-ui"
                    style={{ pointerEvents: "none" }}
                  >
                    {user_avatar.display_number}
                  </text>
                </g>
              </motion.g>

              {/* Ball */}
              <motion.g
                initial={false}
                animate={{ x: ballTarget.x, y: ballTarget.y }}
                transition={{ duration: status === "playing" ? 0.3 : 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ pointerEvents: "none" }}
              >
                <ellipse cx={0.3} cy={1.4} rx={1.6} ry={0.6} fill="rgba(0,0,0,0.4)" />
                <circle r={1.7} fill="#ffffff" stroke="#0f172a" strokeWidth={0.3} />
                <polygon points="0,-0.7 0.67,-0.22 0.41,0.57 -0.41,0.57 -0.67,-0.22" fill="#0f172a" />
              </motion.g>
            </svg>

            {/* Hint sits at the top (players stand at the bottom) and steps aside for failure messages */}
            {!toast && interactive && (
              <div className="pointer-events-none absolute right-2 top-2 max-w-[42%] rounded-xl bg-black/45 px-2.5 py-1 text-right text-[10px] font-semibold leading-snug text-slate-300 backdrop-blur">
                გადაათრიე #8 · დაატრიალე რგოლით
              </div>
            )}
          </div>
        </section>

        {/* ===== Bottom sheet ===== */}
        <section className="relative z-20 mt-2 rounded-t-[28px] border-t border-white/10 bg-slate-900/80 px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 backdrop-blur-2xl">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />

          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-extrabold leading-tight">{lesson.tactical_context.scenario_title_ka}</h1>
            {attempts > 0 && <span className="ml-auto shrink-0 text-[11px] font-bold text-slate-500">ცდა {attempts}</span>}
          </div>
          {/* Long prompt: two lines by default, tap to read all of it (keeps the pitch big on small phones) */}
          <button
            type="button"
            onClick={() => setPromptOpen((o) => !o)}
            className={`mt-1 w-full text-left text-[12.5px] leading-relaxed text-slate-300 ${promptOpen ? "" : "line-clamp-2"}`}
          >
            {lesson.tactical_context.scenario_prompt_ka}
          </button>

          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <Compass
              className="h-5 w-5 shrink-0 text-cyan-300 transition-transform"
              style={{ transform: `rotate(${bodyAngle - 45}deg)` }}
            />
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={bodyAngle}
              disabled={!interactive}
              onChange={(e) => {
                setBodyAngle(Number(e.target.value));
                setToast(null);
              }}
              aria-label="body angle"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400 disabled:opacity-50"
            />
            <span className="w-11 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-white">{bodyAngle}°</span>
          </div>

          <div className="mt-2 flex gap-2">
            {[
              { label: "ბურთი (#4)", ok: seesBall },
              { label: "მეტოქის კარი", ok: seesGoal },
            ].map(({ label, ok }) => (
              <div
                key={label}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-colors ${
                  ok
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {ok ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {label}
              </div>
            ))}
          </div>

          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={!interactive}
            whileTap={{ scale: 0.96 }}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 py-3.5 text-lg font-black text-slate-950 shadow-[0_10px_35px_rgba(34,211,238,0.45)] transition disabled:opacity-60"
          >
            <CheckCircle2 className="h-5 w-5" strokeWidth={2.6} />
            შემოწმება
          </motion.button>
        </section>

        {/* ===== Victory modal ===== */}
        <AnimatePresence>
          {status === "success" && (
            <VictoryModal
              reactionMs={finalMs}
              baseElo={lesson.rewards.base_elo}
              speedBonus={speedBonus}
              stats={lesson.rewards.stats}
              title={lesson.pedagogical_feedback.success.title_ka}
              explanation={lesson.pedagogical_feedback.success.explanation_ka}
              soundOn={soundOn}
              onToggleSound={toggleSound}
              onNext={resetPuzzle}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
