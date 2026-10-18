import * as react from 'react';
import { CSSProperties } from 'react';
import { z } from 'zod';

/** A zone is either a landmark id or an explicit rectangle. */
declare const ZoneSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    x0: z.ZodNumber;
    x1: z.ZodNumber;
    y0: z.ZodNumber;
    y1: z.ZodNumber;
}, z.core.$strict>]>;
/** Plain per-language strings. ka is required for publishing; the checker enforces it. */
declare const LocalizedSchema: z.ZodRecord<z.ZodString, z.ZodString>;
type Zone = z.infer<typeof ZoneSchema>;
type Localized = z.infer<typeof LocalizedSchema>;
declare const MoveStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"move">;
    who: z.ZodString;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        landmark: z.ZodString;
        offset: z.ZodOptional<z.ZodObject<{
            dmx: z.ZodNumber;
            dmy: z.ZodNumber;
        }, z.core.$strict>>;
        resolvedAt: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    face: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodLiteral<"ball">]>>;
}, z.core.$strict>;
declare const RunPathStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"run_path">;
    who: z.ZodString;
    path: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PassStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"pass">;
    from: z.ZodString;
    to: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    lofted: z.ZodOptional<z.ZodBoolean>;
    interceptedBy: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const ShootStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"shoot">;
    from: z.ZodString;
    target: z.ZodUnion<readonly [z.ZodLiteral<"goal">, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    result: z.ZodEnum<{
        goal: "goal";
        save: "save";
        wide: "wide";
    }>;
}, z.core.$strict>;
declare const RushStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"rush">;
    who: z.ZodString;
    at: z.ZodString;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const FlagStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"flag">;
    reason: z.ZodLiteral<"offside">;
}, z.core.$strict>;
declare const WaitStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"wait">;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Replays the child's own answer (their drag, drawn run with its timed pass, or pass sequence). */
declare const PlayAnswerStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"play_answer">;
    ms: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/** Zoom or pan: to an area, to the whole pitch, back to the task camera, or following a player. */
declare const CameraStep$3: z.ZodObject<{
    kind: z.ZodLiteral<"camera">;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        preset: z.ZodEnum<{
            pitch: "pitch";
            focus: "focus";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        follow: z.ZodString;
        widthM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Dim everything except an area or some players. `on: null` turns the spotlight off. */
declare const SpotlightStep$3: z.ZodObject<{
    kind: z.ZodLiteral<"spotlight">;
    on: z.ZodUnion<readonly [z.ZodObject<{
        zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>;
    }, z.core.$strict>, z.ZodObject<{
        players: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodNull]>;
    dim: z.ZodOptional<z.ZodNumber>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PulseStep$3: z.ZodObject<{
    kind: z.ZodLiteral<"pulse">;
    who: z.ZodArray<z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const RevealStep$3: z.ZodObject<{
    kind: z.ZodLiteral<"reveal">;
    zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const SlowmoStep$3: z.ZodObject<{
    kind: z.ZodLiteral<"slowmo">;
    factor: z.ZodNumber;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const CaptionStep$3: z.ZodObject<{
    kind: z.ZodLiteral<"caption">;
    text: z.ZodRecord<z.ZodString, z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
type DirectorStep$3 = z.infer<typeof CameraStep$3> | z.infer<typeof SpotlightStep$3> | z.infer<typeof PulseStep$3> | z.infer<typeof RevealStep$3> | z.infer<typeof SlowmoStep$3> | z.infer<typeof CaptionStep$3>;
type Step$2 = z.infer<typeof MoveStep$2> | z.infer<typeof RunPathStep$2> | z.infer<typeof PassStep$2> | z.infer<typeof ShootStep$2> | z.infer<typeof RushStep$2> | z.infer<typeof FlagStep$2> | z.infer<typeof WaitStep$2> | z.infer<typeof PlayAnswerStep$2> | DirectorStep$3 | GroupStep$2;
interface Script$2 {
    mode: "sequential" | "parallel";
    steps: Step$2[];
}
type GroupStep$2 = {
    kind: "group";
    script: Script$2;
};
declare const GroupStep$2: z.ZodType<GroupStep$2>;
/**
 * Hint ladder: after N wrong tries in a stage, show more help.
 * The highest level reached applies; each level reached costs 25 % of the XP (floor 25 %).
 */
declare const HintSchema: z.ZodObject<{
    afterWrong: z.ZodNumber;
    text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    showZones: z.ZodOptional<z.ZodBoolean>;
    reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>]>>>;
    pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
    spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>;
    }, z.core.$strict>, z.ZodObject<{
        players: z.ZodArray<z.ZodString>;
    }, z.core.$strict>]>>;
    ghost: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
declare const LessonSchema$2: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    id: z.ZodString;
    meta: z.ZodObject<{
        title: z.ZodRecord<z.ZodString, z.ZodString>;
        topic: z.ZodString;
        level: z.ZodEnum<{
            recognize: "recognize";
            decide: "decide";
            execute: "execute";
            defend: "defend";
            "game-speed": "game-speed";
        }>;
        difficulty: z.ZodNumber;
        ageBand: z.ZodEnum<{
            "9-10": "9-10";
            "11-13": "11-13";
        }>;
        positions: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            GK: "GK";
            DEF: "DEF";
            MID: "MID";
            ATT: "ATT";
        }>>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodEnum<{
            draft: "draft";
            review: "review";
            approved: "approved";
            archived: "archived";
        }>;
        source: z.ZodEnum<{
            coach: "coach";
            ai: "ai";
            "ai+coach": "ai+coach";
        }>;
        author: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.core.$strict>>;
        checkedAt: z.ZodOptional<z.ZodISODateTime>;
        render: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            passed: "passed";
            failed: "failed";
        }>>;
        template: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    scene: z.ZodObject<{
        camera: z.ZodObject<{
            focus: z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>;
        }, z.core.$strict>;
        players: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            team: z.ZodEnum<{
                home: "home";
                away: "away";
            }>;
            number: z.ZodNumber;
            role: z.ZodOptional<z.ZodString>;
            at: z.ZodUnion<readonly [z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>;
            facing: z.ZodNumber;
            isGK: z.ZodOptional<z.ZodBoolean>;
            highlight: z.ZodOptional<z.ZodBoolean>;
            behaviour: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"static">;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"follow">;
                target: z.ZodString;
                gapM: z.ZodNumber;
                speedMps: z.ZodOptional<z.ZodNumber>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"holdLine">;
                withIds: z.ZodArray<z.ZodString>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"press">;
                target: z.ZodString;
                speedMps: z.ZodNumber;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"cover">;
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>], "kind">>;
        }, z.core.$strict>>;
        ball: z.ZodUnion<readonly [z.ZodObject<{
            at: z.ZodUnion<readonly [z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>;
        }, z.core.$strict>, z.ZodObject<{
            holder: z.ZodString;
        }, z.core.$strict>]>;
        overlays: z.ZodOptional<z.ZodArray<z.ZodObject<{
            landmark: z.ZodString;
            style: z.ZodOptional<z.ZodEnum<{
                zone: "zone";
                hint: "hint";
                line: "line";
            }>>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    intro: z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>;
    interaction: z.ZodObject<{
        type: z.ZodEnum<{
            path: "path";
            drag: "drag";
            pass_sequence: "pass_sequence";
            choose: "choose";
            tap_target: "tap_target";
        }>;
        who: z.ZodArray<z.ZodString>;
        allowRotate: z.ZodOptional<z.ZodBoolean>;
        bounds: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>, z.ZodObject<{
            landmark: z.ZodString;
            offset: z.ZodOptional<z.ZodObject<{
                dmx: z.ZodNumber;
                dmy: z.ZodNumber;
            }, z.core.$strict>>;
            resolvedAt: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>]>>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            at: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
        path: z.ZodOptional<z.ZodObject<{
            maxLengthM: z.ZodOptional<z.ZodNumber>;
            runSpeedMps: z.ZodOptional<z.ZodNumber>;
            passAfterM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        tapRadiusM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    rules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>;
            toleranceM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"in_zone">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
            clearanceM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"lane_open">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"sees">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            defender: z.ZodString;
            minDeg: z.ZodNumber;
            maxDeg: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"diagonal_behind">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            passAfterM: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"onside_at_pass">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            minM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"path_clear">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            order: z.ZodOptional<z.ZodArray<z.ZodString>>;
            anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"sequence">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
                team: z.ZodEnum<{
                    home: "home";
                    away: "away";
                }>;
            }, z.core.$strict>]>;
            m: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"min_distance">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>;
            m: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"max_distance">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            presser: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"out_of_shadow">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            presser: z.ZodString;
            target: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"in_shadow">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"picks">;
    }, z.core.$strict>], "type">>;
    solution: z.ZodObject<{
        moves: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            at: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>;
            facing: z.ZodOptional<z.ZodNumber>;
            path: z.ZodOptional<z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        sequence: z.ZodOptional<z.ZodArray<z.ZodString>>;
        pick: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>]>>;
        tolerance: z.ZodObject<{
            radiusM: z.ZodNumber;
            facingDeg: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
    }, z.core.$strict>;
    outcomes: z.ZodObject<{
        success: z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>;
        fail: z.ZodUnion<readonly [z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>, z.ZodRecord<z.ZodString, z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>>]>;
    }, z.core.$strict>;
    text: z.ZodObject<{
        banner: z.ZodRecord<z.ZodString, z.ZodString>;
        hint: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        fail: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>;
        almost: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        success: z.ZodRecord<z.ZodString, z.ZodString>;
        lessonLine: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strict>;
    rewards: z.ZodObject<{
        xp: z.ZodNumber;
        speedBonus: z.ZodOptional<z.ZodObject<{
            underSeconds: z.ZodNumber;
            xp: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    timing: z.ZodOptional<z.ZodObject<{
        introMs: z.ZodOptional<z.ZodNumber>;
        timeLimitMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        afterWrong: z.ZodNumber;
        text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        showZones: z.ZodOptional<z.ZodBoolean>;
        reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>>>;
        pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
        spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>;
        }, z.core.$strict>, z.ZodObject<{
            players: z.ZodArray<z.ZodString>;
        }, z.core.$strict>]>>;
        ghost: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>>;
    stages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        camera: z.ZodObject<{
            focus: z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>;
        }, z.core.$strict>;
        overlays: z.ZodOptional<z.ZodArray<z.ZodObject<{
            landmark: z.ZodString;
            style: z.ZodOptional<z.ZodEnum<{
                zone: "zone";
                hint: "hint";
                line: "line";
            }>>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
        intro: z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>;
        interaction: z.ZodObject<{
            type: z.ZodEnum<{
                path: "path";
                drag: "drag";
                pass_sequence: "pass_sequence";
                choose: "choose";
                tap_target: "tap_target";
            }>;
            who: z.ZodArray<z.ZodString>;
            allowRotate: z.ZodOptional<z.ZodBoolean>;
            bounds: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>>;
            options: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                at: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>;
                label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, z.core.$strict>>>;
            path: z.ZodOptional<z.ZodObject<{
                maxLengthM: z.ZodOptional<z.ZodNumber>;
                runSpeedMps: z.ZodOptional<z.ZodNumber>;
                passAfterM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>>;
            tapRadiusM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        rules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
                toleranceM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"in_zone">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                clearanceM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"lane_open">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>]>>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"sees">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                defender: z.ZodString;
                minDeg: z.ZodNumber;
                maxDeg: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"diagonal_behind">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                passAfterM: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"onside_at_pass">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                minM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"path_clear">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                order: z.ZodOptional<z.ZodArray<z.ZodString>>;
                anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"sequence">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
                    team: z.ZodEnum<{
                        home: "home";
                        away: "away";
                    }>;
                }, z.core.$strict>]>;
                m: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"min_distance">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>]>;
                m: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"max_distance">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                presser: z.ZodString;
                lengthM: z.ZodOptional<z.ZodNumber>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"out_of_shadow">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                presser: z.ZodString;
                target: z.ZodString;
                lengthM: z.ZodOptional<z.ZodNumber>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"in_shadow">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"picks">;
        }, z.core.$strict>], "type">>;
        solution: z.ZodObject<{
            moves: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                at: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
                facing: z.ZodOptional<z.ZodNumber>;
                path: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
            sequence: z.ZodOptional<z.ZodArray<z.ZodString>>;
            pick: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>>;
            tolerance: z.ZodObject<{
                radiusM: z.ZodNumber;
                facingDeg: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
        }, z.core.$strict>;
        outcomes: z.ZodObject<{
            success: z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>;
            fail: z.ZodUnion<readonly [z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>, z.ZodRecord<z.ZodString, z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>>]>;
        }, z.core.$strict>;
        text: z.ZodObject<{
            success: z.ZodRecord<z.ZodString, z.ZodString>;
            hint: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            banner: z.ZodRecord<z.ZodString, z.ZodString>;
            fail: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>;
            almost: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>;
        hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            afterWrong: z.ZodNumber;
            text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            showZones: z.ZodOptional<z.ZodBoolean>;
            reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>>>;
            pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
            spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
            }, z.core.$strict>, z.ZodObject<{
                players: z.ZodArray<z.ZodString>;
            }, z.core.$strict>]>>;
            ghost: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>>;
        timing: z.ZodOptional<z.ZodObject<{
            timeLimitMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    finale: z.ZodOptional<z.ZodType<Script$2, unknown, z.core.$ZodTypeInternals<Script$2, unknown>>>;
}, z.core.$strict>;
type Lesson$2 = z.infer<typeof LessonSchema$2>;
type Hint = z.infer<typeof HintSchema>;

/**
 * What the child did. Sent from the player to the judge, and to host callbacks
 * (onAttempt), so it is part of the contract too.
 */
declare const AnswerSchema$1: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"drag">;
    moves: z.ZodRecord<z.ZodString, z.ZodObject<{
        at: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>;
        facing: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"path">;
    who: z.ZodString;
    path: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"pass_sequence">;
    sequence: z.ZodArray<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"choose">;
    pick: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"tap_target">;
    pick: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
}, z.core.$strict>], "type">;
type Answer$1 = z.infer<typeof AnswerSchema$1>;

/** A point in normalized pitch coordinates (0–100 on both axes). */
interface P$2 {
    x: number;
    y: number;
}
/** home = the child's team, attacks towards y = 100. */
type Team$2 = "home" | "away";
/** The minimum a geometry function needs to know about a player. */
interface GeoPlayer$1 {
    id: string;
    team: Team$2;
    at: P$2;
    /** Degrees in metre space, 0 = towards y = 100, clockwise positive. */
    facing?: number;
    isGK?: boolean;
}
/** A frozen moment: where everyone and the ball are. */
interface SceneSnapshot$1 {
    players: readonly GeoPlayer$1[];
    ball: P$2;
}

declare const MoveStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"move">;
    who: z.ZodString;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        landmark: z.ZodString;
        offset: z.ZodOptional<z.ZodObject<{
            dmx: z.ZodNumber;
            dmy: z.ZodNumber;
        }, z.core.$strict>>;
        resolvedAt: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    face: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodLiteral<"ball">]>>;
}, z.core.$strict>;
declare const RunPathStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"run_path">;
    who: z.ZodString;
    path: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PassStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"pass">;
    from: z.ZodString;
    to: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    lofted: z.ZodOptional<z.ZodBoolean>;
    interceptedBy: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const ShootStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"shoot">;
    from: z.ZodString;
    target: z.ZodUnion<readonly [z.ZodLiteral<"goal">, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    result: z.ZodEnum<{
        goal: "goal";
        save: "save";
        wide: "wide";
    }>;
}, z.core.$strict>;
declare const RushStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"rush">;
    who: z.ZodString;
    at: z.ZodString;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const FlagStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"flag">;
    reason: z.ZodLiteral<"offside">;
}, z.core.$strict>;
declare const WaitStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"wait">;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Replays the child's own answer (their drag, drawn run with its timed pass, or pass sequence). */
declare const PlayAnswerStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"play_answer">;
    ms: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/** Zoom or pan: to an area, to the whole pitch, back to the task camera, or following a player. */
declare const CameraStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"camera">;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        preset: z.ZodEnum<{
            pitch: "pitch";
            focus: "focus";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        follow: z.ZodString;
        widthM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Dim everything except an area or some players. `on: null` turns the spotlight off. */
declare const SpotlightStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"spotlight">;
    on: z.ZodUnion<readonly [z.ZodObject<{
        zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>;
    }, z.core.$strict>, z.ZodObject<{
        players: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodNull]>;
    dim: z.ZodOptional<z.ZodNumber>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PulseStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"pulse">;
    who: z.ZodArray<z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const RevealStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"reveal">;
    zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const SlowmoStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"slowmo">;
    factor: z.ZodNumber;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const CaptionStep$2: z.ZodObject<{
    kind: z.ZodLiteral<"caption">;
    text: z.ZodRecord<z.ZodString, z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
type DirectorStep$2 = z.infer<typeof CameraStep$2> | z.infer<typeof SpotlightStep$2> | z.infer<typeof PulseStep$2> | z.infer<typeof RevealStep$2> | z.infer<typeof SlowmoStep$2> | z.infer<typeof CaptionStep$2>;
type Step$1 = z.infer<typeof MoveStep$1> | z.infer<typeof RunPathStep$1> | z.infer<typeof PassStep$1> | z.infer<typeof ShootStep$1> | z.infer<typeof RushStep$1> | z.infer<typeof FlagStep$1> | z.infer<typeof WaitStep$1> | z.infer<typeof PlayAnswerStep$1> | DirectorStep$2 | GroupStep$1;
interface Script$1 {
    mode: "sequential" | "parallel";
    steps: Step$1[];
}
type GroupStep$1 = {
    kind: "group";
    script: Script$1;
};
declare const GroupStep$1: z.ZodType<GroupStep$1>;
declare const RuleSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>;
        toleranceM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"in_zone">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        clearanceM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"lane_open">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>]>>;
        halfAngle: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"sees">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        defender: z.ZodString;
        minDeg: z.ZodNumber;
        maxDeg: z.ZodNumber;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"diagonal_behind">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        passAfterM: z.ZodNumber;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"onside_at_pass">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        minM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"path_clear">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        order: z.ZodOptional<z.ZodArray<z.ZodString>>;
        anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"sequence">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
            team: z.ZodEnum<{
                home: "home";
                away: "away";
            }>;
        }, z.core.$strict>]>;
        m: z.ZodNumber;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"min_distance">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>]>;
        m: z.ZodNumber;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"max_distance">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        who: z.ZodString;
        presser: z.ZodString;
        lengthM: z.ZodOptional<z.ZodNumber>;
        halfAngle: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"out_of_shadow">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        presser: z.ZodString;
        target: z.ZodString;
        lengthM: z.ZodOptional<z.ZodNumber>;
        halfAngle: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"in_shadow">;
}, z.core.$strict>, z.ZodObject<{
    params: z.ZodObject<{
        correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
    }, z.core.$strict>;
    failKey: z.ZodString;
    weight: z.ZodOptional<z.ZodEnum<{
        must: "must";
        soft: "soft";
    }>>;
    type: z.ZodLiteral<"picks">;
}, z.core.$strict>], "type">;
type Rule = z.infer<typeof RuleSchema>;
declare const LessonSchema$1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    id: z.ZodString;
    meta: z.ZodObject<{
        title: z.ZodRecord<z.ZodString, z.ZodString>;
        topic: z.ZodString;
        level: z.ZodEnum<{
            recognize: "recognize";
            decide: "decide";
            execute: "execute";
            defend: "defend";
            "game-speed": "game-speed";
        }>;
        difficulty: z.ZodNumber;
        ageBand: z.ZodEnum<{
            "9-10": "9-10";
            "11-13": "11-13";
        }>;
        positions: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            GK: "GK";
            DEF: "DEF";
            MID: "MID";
            ATT: "ATT";
        }>>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodEnum<{
            draft: "draft";
            review: "review";
            approved: "approved";
            archived: "archived";
        }>;
        source: z.ZodEnum<{
            coach: "coach";
            ai: "ai";
            "ai+coach": "ai+coach";
        }>;
        author: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.core.$strict>>;
        checkedAt: z.ZodOptional<z.ZodISODateTime>;
        render: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            passed: "passed";
            failed: "failed";
        }>>;
        template: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    scene: z.ZodObject<{
        camera: z.ZodObject<{
            focus: z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>;
        }, z.core.$strict>;
        players: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            team: z.ZodEnum<{
                home: "home";
                away: "away";
            }>;
            number: z.ZodNumber;
            role: z.ZodOptional<z.ZodString>;
            at: z.ZodUnion<readonly [z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>;
            facing: z.ZodNumber;
            isGK: z.ZodOptional<z.ZodBoolean>;
            highlight: z.ZodOptional<z.ZodBoolean>;
            behaviour: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"static">;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"follow">;
                target: z.ZodString;
                gapM: z.ZodNumber;
                speedMps: z.ZodOptional<z.ZodNumber>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"holdLine">;
                withIds: z.ZodArray<z.ZodString>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"press">;
                target: z.ZodString;
                speedMps: z.ZodNumber;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"cover">;
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>], "kind">>;
        }, z.core.$strict>>;
        ball: z.ZodUnion<readonly [z.ZodObject<{
            at: z.ZodUnion<readonly [z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>;
        }, z.core.$strict>, z.ZodObject<{
            holder: z.ZodString;
        }, z.core.$strict>]>;
        overlays: z.ZodOptional<z.ZodArray<z.ZodObject<{
            landmark: z.ZodString;
            style: z.ZodOptional<z.ZodEnum<{
                zone: "zone";
                hint: "hint";
                line: "line";
            }>>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    intro: z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>;
    interaction: z.ZodObject<{
        type: z.ZodEnum<{
            path: "path";
            drag: "drag";
            pass_sequence: "pass_sequence";
            choose: "choose";
            tap_target: "tap_target";
        }>;
        who: z.ZodArray<z.ZodString>;
        allowRotate: z.ZodOptional<z.ZodBoolean>;
        bounds: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>, z.ZodObject<{
            landmark: z.ZodString;
            offset: z.ZodOptional<z.ZodObject<{
                dmx: z.ZodNumber;
                dmy: z.ZodNumber;
            }, z.core.$strict>>;
            resolvedAt: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>]>>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            at: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
        path: z.ZodOptional<z.ZodObject<{
            maxLengthM: z.ZodOptional<z.ZodNumber>;
            runSpeedMps: z.ZodOptional<z.ZodNumber>;
            passAfterM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        tapRadiusM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    rules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>;
            toleranceM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"in_zone">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
            clearanceM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"lane_open">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"sees">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            defender: z.ZodString;
            minDeg: z.ZodNumber;
            maxDeg: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"diagonal_behind">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            passAfterM: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"onside_at_pass">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            minM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"path_clear">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            order: z.ZodOptional<z.ZodArray<z.ZodString>>;
            anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"sequence">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
                team: z.ZodEnum<{
                    home: "home";
                    away: "away";
                }>;
            }, z.core.$strict>]>;
            m: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"min_distance">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>;
            m: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"max_distance">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            presser: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"out_of_shadow">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            presser: z.ZodString;
            target: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"in_shadow">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"picks">;
    }, z.core.$strict>], "type">>;
    solution: z.ZodObject<{
        moves: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            at: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>;
            facing: z.ZodOptional<z.ZodNumber>;
            path: z.ZodOptional<z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        sequence: z.ZodOptional<z.ZodArray<z.ZodString>>;
        pick: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>]>>;
        tolerance: z.ZodObject<{
            radiusM: z.ZodNumber;
            facingDeg: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
    }, z.core.$strict>;
    outcomes: z.ZodObject<{
        success: z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>;
        fail: z.ZodUnion<readonly [z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>, z.ZodRecord<z.ZodString, z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>>]>;
    }, z.core.$strict>;
    text: z.ZodObject<{
        banner: z.ZodRecord<z.ZodString, z.ZodString>;
        hint: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        fail: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>;
        almost: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        success: z.ZodRecord<z.ZodString, z.ZodString>;
        lessonLine: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strict>;
    rewards: z.ZodObject<{
        xp: z.ZodNumber;
        speedBonus: z.ZodOptional<z.ZodObject<{
            underSeconds: z.ZodNumber;
            xp: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    timing: z.ZodOptional<z.ZodObject<{
        introMs: z.ZodOptional<z.ZodNumber>;
        timeLimitMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        afterWrong: z.ZodNumber;
        text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        showZones: z.ZodOptional<z.ZodBoolean>;
        reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>>>;
        pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
        spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>;
        }, z.core.$strict>, z.ZodObject<{
            players: z.ZodArray<z.ZodString>;
        }, z.core.$strict>]>>;
        ghost: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>>;
    stages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        camera: z.ZodObject<{
            focus: z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>;
        }, z.core.$strict>;
        overlays: z.ZodOptional<z.ZodArray<z.ZodObject<{
            landmark: z.ZodString;
            style: z.ZodOptional<z.ZodEnum<{
                zone: "zone";
                hint: "hint";
                line: "line";
            }>>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
        intro: z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>;
        interaction: z.ZodObject<{
            type: z.ZodEnum<{
                path: "path";
                drag: "drag";
                pass_sequence: "pass_sequence";
                choose: "choose";
                tap_target: "tap_target";
            }>;
            who: z.ZodArray<z.ZodString>;
            allowRotate: z.ZodOptional<z.ZodBoolean>;
            bounds: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>>;
            options: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                at: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>;
                label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, z.core.$strict>>>;
            path: z.ZodOptional<z.ZodObject<{
                maxLengthM: z.ZodOptional<z.ZodNumber>;
                runSpeedMps: z.ZodOptional<z.ZodNumber>;
                passAfterM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>>;
            tapRadiusM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        rules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
                toleranceM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"in_zone">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                clearanceM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"lane_open">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>]>>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"sees">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                defender: z.ZodString;
                minDeg: z.ZodNumber;
                maxDeg: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"diagonal_behind">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                passAfterM: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"onside_at_pass">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                minM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"path_clear">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                order: z.ZodOptional<z.ZodArray<z.ZodString>>;
                anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"sequence">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
                    team: z.ZodEnum<{
                        home: "home";
                        away: "away";
                    }>;
                }, z.core.$strict>]>;
                m: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"min_distance">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>]>;
                m: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"max_distance">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                presser: z.ZodString;
                lengthM: z.ZodOptional<z.ZodNumber>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"out_of_shadow">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                presser: z.ZodString;
                target: z.ZodString;
                lengthM: z.ZodOptional<z.ZodNumber>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"in_shadow">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"picks">;
        }, z.core.$strict>], "type">>;
        solution: z.ZodObject<{
            moves: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                at: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
                facing: z.ZodOptional<z.ZodNumber>;
                path: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
            sequence: z.ZodOptional<z.ZodArray<z.ZodString>>;
            pick: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>>;
            tolerance: z.ZodObject<{
                radiusM: z.ZodNumber;
                facingDeg: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
        }, z.core.$strict>;
        outcomes: z.ZodObject<{
            success: z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>;
            fail: z.ZodUnion<readonly [z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>, z.ZodRecord<z.ZodString, z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>>]>;
        }, z.core.$strict>;
        text: z.ZodObject<{
            success: z.ZodRecord<z.ZodString, z.ZodString>;
            hint: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            banner: z.ZodRecord<z.ZodString, z.ZodString>;
            fail: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>;
            almost: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>;
        hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            afterWrong: z.ZodNumber;
            text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            showZones: z.ZodOptional<z.ZodBoolean>;
            reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>>>;
            pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
            spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
            }, z.core.$strict>, z.ZodObject<{
                players: z.ZodArray<z.ZodString>;
            }, z.core.$strict>]>>;
            ghost: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>>;
        timing: z.ZodOptional<z.ZodObject<{
            timeLimitMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    finale: z.ZodOptional<z.ZodType<Script$1, unknown, z.core.$ZodTypeInternals<Script$1, unknown>>>;
}, z.core.$strict>;
type Lesson$1 = z.infer<typeof LessonSchema$1>;

/**
 * What the child did. Sent from the player to the judge, and to host callbacks
 * (onAttempt), so it is part of the contract too.
 */
declare const AnswerSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"drag">;
    moves: z.ZodRecord<z.ZodString, z.ZodObject<{
        at: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>;
        facing: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"path">;
    who: z.ZodString;
    path: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"pass_sequence">;
    sequence: z.ZodArray<z.ZodString>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"choose">;
    pick: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"tap_target">;
    pick: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
}, z.core.$strict>], "type">;
type Answer = z.infer<typeof AnswerSchema>;

/** A point in normalized pitch coordinates (0–100 on both axes). */
interface P$1 {
    x: number;
    y: number;
}
/** home = the child's team, attacks towards y = 100. */
type Team$1 = "home" | "away";

/** Zoom or pan: to an area, to the whole pitch, back to the task camera, or following a player. */
declare const CameraStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"camera">;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        preset: z.ZodEnum<{
            pitch: "pitch";
            focus: "focus";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        follow: z.ZodString;
        widthM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Dim everything except an area or some players. `on: null` turns the spotlight off. */
declare const SpotlightStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"spotlight">;
    on: z.ZodUnion<readonly [z.ZodObject<{
        zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>;
    }, z.core.$strict>, z.ZodObject<{
        players: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodNull]>;
    dim: z.ZodOptional<z.ZodNumber>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PulseStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"pulse">;
    who: z.ZodArray<z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const RevealStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"reveal">;
    zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const SlowmoStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"slowmo">;
    factor: z.ZodNumber;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const CaptionStep$1: z.ZodObject<{
    kind: z.ZodLiteral<"caption">;
    text: z.ZodRecord<z.ZodString, z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
type DirectorStep$1 = z.infer<typeof CameraStep$1> | z.infer<typeof SpotlightStep$1> | z.infer<typeof PulseStep$1> | z.infer<typeof RevealStep$1> | z.infer<typeof SlowmoStep$1> | z.infer<typeof CaptionStep$1>;

interface SimPlayer {
    id: string;
    team: Team$1;
    isGK: boolean;
    at: P$1;
    /** Degrees, metre space. */
    facing: number;
}
interface SimState {
    players: Record<string, SimPlayer>;
    ball: {
        at: P$1;
        holder: string | null;
    };
}

/** Everything a rule needs to judge one answer. */
interface JudgeContext {
    lesson: Lesson$1;
    /** State at the freeze, before the answer. */
    freeze: SimState;
    /** State with the answer applied (drags moved, path runner at the end of the run). */
    state: SimState;
    scene: SceneSnapshot$1;
    answer: Answer;
    /** Smoothed run, for path answers. */
    path?: P$2[];
    pxPerM: number;
    /** Positional grace in metres. */
    graceM: number;
    /** Facing grace in degrees. */
    facingGraceDeg: number;
}
interface Prepared {
    ctx: JudgeContext;
    /** Players nudged off an overlap, with where they ended up. */
    nudged: Array<{
        id: string;
        from: P$2;
        to: P$2;
    }>;
    /** Players dropped outside the allowed area; they snap back (not a failed attempt). */
    snappedBack: string[];
}

/** How a rule's margin may be forgiven. */
type GraceKind = "position" | "angle" | "half-position" | "none";
interface RuleResult {
    index: number;
    type: Rule["type"];
    failKey: string;
    weight: "must" | "soft";
    /** Signed: ≥ 0 passes. Metres for positional rules, degrees for angles, ±1 for yes/no. */
    margin: number;
    unit: "m" | "deg" | "bool";
    grace: GraceKind;
    /** Passes on its own merit. */
    pass: boolean;
    /** Passes once grace is applied. */
    passWithGrace: boolean;
}

type Result = "correct" | "almost" | "wrong";
interface Verdict {
    result: Result;
    /** For wrong: the first must rule (array order) that failed beyond grace. Picks the fail text and ending. */
    failKey?: string;
    /** For almost: the first rule that only passed thanks to grace (or failed softly). */
    almostKey?: string;
    /** "almost" counts as solved. */
    solved: boolean;
    rules: RuleResult[];
    nudged: Prepared["nudged"];
    snappedBack: string[];
}

/** A point in normalized pitch coordinates (0–100 on both axes). */
interface P {
    x: number;
    y: number;
}
/** home = the child's team, attacks towards y = 100. */
type Team = "home" | "away";
/** The minimum a geometry function needs to know about a player. */
interface GeoPlayer {
    id: string;
    team: Team;
    at: P;
    /** Degrees in metre space, 0 = towards y = 100, clockwise positive. */
    facing?: number;
    isGK?: boolean;
}
/** A frozen moment: where everyone and the ball are. */
interface SceneSnapshot {
    players: readonly GeoPlayer[];
    ball: P;
}
/** Axis-aligned rectangle in normalized coordinates. */
interface Rect {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}
type Shape = ({
    kind: "rect";
} & Rect) | {
    kind: "circle";
    c: P;
    rM: number;
} | {
    kind: "polygon";
    pts: P[];
} | {
    kind: "segment";
    a: P;
    b: P;
} | {
    kind: "point";
    p: P;
};
/** Resolve a landmark or dynamic-area id to a shape. Throws GeometryError. */
declare function resolveLandmark(id: string, scene?: SceneSnapshot): Shape;

/** A director instruction placed in time (camera, spotlight, pulse, reveal, slow motion, caption). */
interface Cue {
    t: number;
    end: number;
    step: DirectorStep$1;
}

type SoundKey = "kick" | "net" | "whistle" | "ding" | "oooh" | "roar";
declare const SOUND_KEYS: SoundKey[];
interface PlayerAssets {
    /** URL for a sound; return undefined to use the bundled placeholder. */
    soundUrl?: (key: SoundKey) => string | undefined;
}
/**
 * Sample playback. Sounds load on first use; browsers (iOS especially) only allow
 * audio after a touch, so `unlock()` is called from the first pointer-down.
 */
declare class Sounds {
    private readonly assets;
    private howls;
    private loading;
    muted: boolean;
    constructor(assets?: PlayerAssets);
    private load;
    unlock(): void;
    play(key: SoundKey): void;
    dispose(): void;
}

interface AttemptEvent {
    lessonId: string;
    /** 1 for the first try. */
    attempt: number;
    answer: Answer$1;
    result: Verdict["result"];
    failKey?: string;
    almostKey?: string;
    /** Time from the task appearing to Check. */
    msOnTask: number;
    timedOut: boolean;
    /** Stage number (1 = first) and its id, for story lessons. */
    stage: number;
    stageId?: string;
    /** Hint levels showing when the child pressed Check. */
    hintLevel: number;
}
interface CompleteEvent {
    lessonId: string;
    result: "correct" | "almost";
    attempts: number;
    xp: number;
    msTotal: number;
    /** Hint levels used across all stages (each costs 25 % of the XP, floor 25 %). */
    hintLevels: number;
}
interface LessonPlayerProps {
    lesson: Lesson$2;
    /** Text language; falls back to Georgian, then English. */
    lang?: string;
    assets?: PlayerAssets;
    muted?: boolean;
    onAttempt?: (e: AttemptEvent) => void;
    onComplete?: (e: CompleteEvent) => void;
    /** The host decides what "next" means. Hidden when not given. */
    onNext?: () => void;
    /** Start straight at the task (Studio previews, tests). */
    skipIntro?: boolean;
    /** Studio preview: show the hints as if the child had already made this many mistakes. */
    previewWrong?: number;
    className?: string;
    style?: CSSProperties;
}
/**
 * The child-facing lesson player. Fills its container; size the container 9:16.
 * Story lessons play stage after stage; a mistake only repeats the current stage.
 */
declare function LessonPlayer(props: LessonPlayerProps): react.JSX.Element;

/** Static pitch markings, in metres. Mown stripes every 10.5 m, faint guides for the five vertical lanes. */
declare const Pitch: react.NamedExoticComponent<{
    netRipple?: number;
}>;

interface TokenMeta {
    id: string;
    team: "home" | "away";
    number: number;
    isGK?: boolean;
    highlight?: boolean;
    /** Short role shown under the token (CB, DM…). */
    role?: string;
}
interface Pos {
    x: number;
    y: number;
    facing: number;
}
declare function shapeToSvg(shape: Shape, props: Record<string, unknown>): react.JSX.Element | null;
/**
 * A player token: a shadow, a facing arrow, the shirt with its number and the role underneath.
 * The child's player glows; players the child can move breathe with a cyan halo.
 */
declare const Token: react.NamedExoticComponent<{
    meta: TokenMeta;
    pos: Pos;
    touchable?: boolean;
    selected?: boolean;
    dim?: boolean;
    scale?: number;
    showRole?: boolean;
}>;
declare const Ball: react.NamedExoticComponent<{
    at: P;
    trail?: readonly P[];
    scale?: number;
}>;
/** A glowing open lane, a pass arrow (yellow, as the ball will go) or a blocked pass (rose, dashed). */
declare function PassLine({ from, to, kind, scale }: {
    from: P;
    to: P;
    kind: "lane" | "arrow" | "blocked";
    scale?: number;
}): react.JSX.Element;
/** The child's drawn run (cyan, dashed), with an arrowhead and a marker where the pass will be played. */
declare function RunPath({ path, passAt }: {
    path: readonly P[];
    passAt?: P;
}): react.JSX.Element | null;
/** A choose option: a cyan ring with its letter. */
declare function OptionMark({ at, label, picked }: {
    at: P;
    label: string;
    picked?: boolean;
}): react.JSX.Element;
/** Where a dragged player started, so the child can see the move. */
declare function Ghost({ at, scale }: {
    at: P;
    scale?: number;
}): react.JSX.Element;
/** Rotate handle: a dashed ring around the player and a knob on the facing line. */
declare function RotateHandle({ at, facing, distM }: {
    at: P;
    facing: number;
    distM: number;
}): react.JSX.Element;

/** An SVG viewBox in metres (D10). */
interface ViewBox {
    x: number;
    y: number;
    w: number;
    h: number;
}
interface Insets {
    top: number;
    bottom: number;
}
/**
 * Fit the camera focus into the area between the banner and the Check bar.
 * The viewBox spans the whole element (so the pitch shows behind the HUD) and the
 * element is drawn with preserveAspectRatio="none", which keeps the mapping linear.
 */
declare function viewBoxFor(focus: Rect, size: {
    w: number;
    h: number;
}, insets?: Insets): ViewBox & {
    pxPerM: number;
};
/** Smallest rect containing the focus and all points, with a margin in normalized units. */
declare function rectAround(focus: Rect, pts: readonly P[], margin?: number): Rect;
/** Client pixel → normalized pitch point, given the element's rect and the current viewBox. */
declare function clientToPitch(clientX: number, clientY: number, rect: {
    left: number;
    top: number;
    width: number;
    height: number;
}, vb: ViewBox): P;

/** SteadyBall's look: deep green pitch, sky-blue team, rose opponents, the child in yellow, cyan for everything interactive. */
declare const COLORS: {
    readonly grass: "#13381e";
    readonly grassStripe: "#164024";
    readonly grassStripe2: "#1a472a";
    readonly chalk: "#ffffff";
    readonly home: "#0284c7";
    readonly homeStroke: "#7dd3fc";
    readonly homeInk: "#FFFFFF";
    readonly away: "#be123c";
    readonly awayStroke: "#fda4af";
    readonly awayInk: "#FFFFFF";
    readonly keeperHome: "#059669";
    readonly keeperHomeStroke: "#6ee7b7";
    readonly keeperAway: "#7c3aed";
    readonly keeperAwayStroke: "#c4b5fd";
    /** The child's own player. */
    readonly avatar: "#facc15";
    readonly avatarInk: "#0f172a";
    /** Interactive highlights: zones, lanes, glows. (Named flood for history.) */
    readonly flood: "#22d3ee";
    readonly pass: "#fde047";
    readonly gold: "#facc15";
    readonly navy: "#020617";
    readonly panel: "#0f172a";
    readonly wrong: "#fb7185";
    readonly almost: "#fbbf24";
    readonly ok: "#34d399";
};
/** Player CSS, injected once. All classes are prefixed "pss-". */
declare const PLAYER_CSS = "\n.pss-root{position:relative;width:100%;height:100%;overflow:hidden;background:#020617;font-family:ui-sans-serif, system-ui, \"Noto Sans Georgian\", \"BPG Glaho\", \"Sylfaen\", \"Segoe UI\", Roboto, sans-serif;color:#fff;\n  -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;contain:layout paint}\n.pss-root *{box-sizing:border-box}\n.pss-root::after{content:\"\";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 50px rgba(0,0,0,.55)}\n.pss-svg{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter .45s ease}\n.pss-blur .pss-svg{filter:blur(2px) brightness(.8)}\n.pss-shake{animation:pss-shake .45s cubic-bezier(.36,.07,.19,.97)}\n@keyframes pss-shake{10%,90%{transform:translate(-1px,1px)}20%,80%{transform:translate(2px,-1px)}30%,50%,70%{transform:translate(-4px,2px)}40%,60%{transform:translate(4px,-2px)}}\n\n.pss-banner{position:absolute;left:8px;right:8px;top:8px;min-height:40px;padding:9px 12px 9px 14px;border-radius:16px;z-index:3;\n  background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 10px 30px rgba(0,0,0,.35);\n  font-weight:800;font-size:15px;line-height:1.3;transform:translateY(-140%);transition:transform .35s cubic-bezier(.2,.9,.3,1.2);display:flex;align-items:center;gap:10px}\n.pss-banner.pss-in{transform:none}\n.pss-banner-text{flex:1;min-width:0}\n.pss-timer{position:absolute;left:14px;right:14px;bottom:4px;height:3px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden}\n.pss-timer>i{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#34d399);transform-origin:left}\n.pss-hint{flex:none;width:30px;height:30px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#e2e8f0;font:800 15px/1 ui-sans-serif, system-ui, \"Noto Sans Georgian\", \"BPG Glaho\", \"Sylfaen\", \"Segoe UI\", Roboto, sans-serif}\n\n.pss-toast{position:absolute;left:8px;right:8px;top:8px;z-index:4;display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:16px;\n  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 18px 40px rgba(0,0,0,.45);animation:pss-drop .38s cubic-bezier(.2,.9,.3,1.25)}\n.pss-toast.pss-bad{background:rgba(76,5,25,.82);border:1px solid rgba(251,113,133,.4)}\n.pss-toast.pss-meh{background:rgba(69,26,3,.82);border:1px solid rgba(251,191,36,.4)}\n.pss-toast svg{flex:none;width:20px;height:20px;margin-top:1px}\n.pss-toast.pss-bad svg{color:#fda4af}\n.pss-toast.pss-meh svg{color:#fcd34d}\n.pss-toast-title{margin:0;font-size:14px;font-weight:800;line-height:1.3}\n.pss-toast-msg{margin:2px 0 0;font-size:12.5px;line-height:1.38;color:#e2e8f0}\n@keyframes pss-drop{from{transform:translateY(-30px) scale(.95);opacity:0}}\n\n.pss-bar{position:absolute;left:8px;right:8px;bottom:8px;height:56px;display:flex;gap:8px;z-index:3}\n.pss-btn{flex:1;border:0;border-radius:18px;font:900 18px/1 ui-sans-serif, system-ui, \"Noto Sans Georgian\", \"BPG Glaho\", \"Sylfaen\", \"Segoe UI\", Roboto, sans-serif;cursor:pointer;touch-action:manipulation;min-height:44px;\n  display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s,opacity .2s}\n.pss-btn:active{transform:scale(.96)}\n.pss-btn svg{width:20px;height:20px}\n.pss-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}\n.pss-btn-main{background:linear-gradient(90deg,#22d3ee,#38bdf8,#34d399);color:#020617;box-shadow:0 10px 35px rgba(34,211,238,.45)}\n.pss-btn-main:disabled{opacity:.55;box-shadow:0 6px 20px rgba(34,211,238,.18)}\n.pss-btn-ghost{flex:0 0 auto;padding:0 16px;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.12);color:#e2e8f0;font-size:16px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}\n\n.pss-goal{position:absolute;left:0;right:0;top:34%;text-align:center;font-weight:900;font-size:56px;letter-spacing:.02em;\n  background:linear-gradient(180deg,#fde68a,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent;\n  filter:drop-shadow(0 4px 0 #020617) drop-shadow(0 0 24px rgba(250,204,21,.55));transform:scale(.2);opacity:0;pointer-events:none;z-index:2}\n.pss-goal.pss-in{animation:pss-goal 1.4s cubic-bezier(.2,.9,.3,1.3) forwards}\n@keyframes pss-goal{0%{transform:scale(.2) rotate(-6deg);opacity:0}25%{transform:scale(1.15) rotate(2deg);opacity:1}40%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:scale(1.05)}}\n.pss-flood{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at 50% -10%,rgba(165,243,252,.75),rgba(34,211,238,.2) 40%,transparent 70%)}\n.pss-flood.pss-in{animation:pss-flood 1.2s ease-out}\n@keyframes pss-flood{0%{opacity:0}15%{opacity:1}100%{opacity:0}}\n\n.pss-modal{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.72);\n  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;transition:opacity .3s}\n.pss-modal.pss-in{opacity:1}\n.pss-card{position:relative;width:100%;overflow:hidden;border-radius:30px;border:1px solid rgba(255,255,255,.1);\n  background:linear-gradient(180deg,rgba(30,41,59,.92),rgba(15,23,42,.96));padding:22px 18px 14px;box-shadow:0 0 60px rgba(34,211,238,.25);\n  transform:scale(.6) translateY(40px);opacity:0;transition:transform .5s cubic-bezier(.2,1.3,.4,1),opacity .3s}\n.pss-modal.pss-in .pss-card{transform:none;opacity:1}\n.pss-card::before{content:\"\";position:absolute;top:-96px;left:50%;width:192px;height:192px;margin-left:-96px;border-radius:50%;background:rgba(34,211,238,.2);filter:blur(40px);pointer-events:none}\n.pss-trophy{position:relative;width:88px;height:88px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;\n  background:linear-gradient(135deg,#fde047,#f59e0b);box-shadow:0 0 40px rgba(250,204,21,.55);animation:pss-trophy .6s cubic-bezier(.2,1.5,.4,1) .1s both}\n.pss-trophy svg{width:44px;height:44px;color:#0f172a}\n.pss-trophy i{position:absolute;left:50%;top:50%;width:7px;height:7px;margin:-3.5px;border-radius:50%;opacity:0;animation:pss-spark 1.1s ease-out .15s}\n@keyframes pss-trophy{from{transform:rotate(-25deg) scale(0)}}\n@keyframes pss-spark{0%{opacity:1;transform:translate(0,0) scale(0)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.2)}}\n.pss-line{position:relative;text-align:center;font-size:20px;font-weight:900;line-height:1.25;margin:0 0 4px}\n.pss-sub{position:relative;text-align:center;font-size:13px;line-height:1.5;color:#cbd5e1;margin:10px 0 0}\n.pss-stats{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}\n.pss-stat{border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);padding:10px;text-align:center}\n.pss-stat b{display:block;font:900 22px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace}\n.pss-stat span{display:block;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:3px}\n.pss-stat.pss-xp{border-color:rgba(52,211,153,.3);background:rgba(52,211,153,.1)}\n.pss-stat.pss-xp b{color:#6ee7b7}\n.pss-stat.pss-xp span{color:#6ee7b7}\n.pss-card .pss-bar{position:relative;left:0;right:0;bottom:0;height:52px;margin-top:16px}\n\n.pss-pulse{transform-box:fill-box;transform-origin:center;animation:pss-pulse 1.6s ease-in-out infinite}\n@keyframes pss-pulse{0%,100%{opacity:.35;transform:scale(.92)}50%{opacity:1;transform:scale(1.12)}}\n.pss-halo{transform-box:fill-box;transform-origin:center;animation:pss-halo 2s ease-in-out infinite}\n@keyframes pss-halo{0%,100%{opacity:.14;transform:scale(1)}50%{opacity:.32;transform:scale(1.15)}}\n.pss-march{animation:pss-march 1.6s linear infinite}\n@keyframes pss-march{to{stroke-dashoffset:-6}}\n.pss-net-go{animation:pss-net .7s cubic-bezier(.2,.9,.3,1.4)}\n@keyframes pss-net{0%{transform:scaleY(1)}30%{transform:scaleY(1.6)}60%{transform:scaleY(.85)}100%{transform:scaleY(1)}}\n\n.pss-stages{flex:none;display:flex;gap:4px}\n.pss-stages i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2)}\n.pss-stages i.pss-done{background:#34d399}\n.pss-stages i.pss-now{background:#22d3ee;box-shadow:0 0 8px rgba(34,211,238,.9)}\n.pss-caption{position:absolute;left:50%;top:64px;z-index:3;max-width:calc(100% - 32px);padding:9px 18px;border-radius:999px;\n  background:rgba(15,23,42,.8);border:1px solid rgba(34,211,238,.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 0 28px rgba(34,211,238,.35);\n  font-weight:900;font-size:18px;line-height:1.25;text-align:center;pointer-events:none;transform:translate(-50%,-12px) scale(.9);opacity:0}\n.pss-caption.pss-in{animation:pss-pop .35s cubic-bezier(.2,.9,.3,1.3) forwards}\n.pss-caption.pss-done-toast{border-color:rgba(52,211,153,.6);box-shadow:0 0 28px rgba(52,211,153,.35)}\n@keyframes pss-pop{to{transform:translate(-50%,0) scale(1);opacity:1}}\n.pss-chip{position:absolute;left:12px;right:12px;top:62px;z-index:3;display:flex;gap:8px;align-items:flex-start;padding:8px 12px;border-radius:14px;\n  background:rgba(69,26,3,.78);border:1px solid rgba(251,191,36,.45);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font-weight:700;font-size:13.5px;line-height:1.35;color:#fef3c7;\n  pointer-events:none;animation:pss-pop-l .3s ease-out}\n.pss-chip svg{flex:none;width:16px;height:16px;margin-top:1px;color:#fbbf24}\n@keyframes pss-pop-l{from{transform:translateY(-8px);opacity:0}}\n@media (prefers-reduced-motion:reduce){.pss-root *{animation-duration:.01s!important;transition-duration:.01s!important}}\n";
declare function injectCss(doc?: Document | undefined): void;

type Lang = string;
/** Pick a language: requested → Georgian → English → anything. */
declare function t(text: Localized | undefined, lang: Lang): string;
/** Fixed interface words. Actions keep the same name through the flow. */
declare const UI: {
    check: {
        ka: string;
        en: string;
    };
    tryAgain: {
        ka: string;
        en: string;
    };
    next: {
        ka: string;
        en: string;
    };
    watchAgain: {
        ka: string;
        en: string;
    };
    undo: {
        ka: string;
        en: string;
    };
    clear: {
        ka: string;
        en: string;
    };
    goal: {
        ka: string;
        en: string;
    };
    almostTitle: {
        ka: string;
        en: string;
    };
    timeUp: {
        ka: string;
        en: string;
    };
    hint: {
        ka: string;
        en: string;
    };
    notYet: {
        ka: string;
        en: string;
    };
    time: {
        ka: string;
        en: string;
    };
};

/**
 * Director effects at a moment in time (D18). Pure functions over the cues a
 * simulation produced, so the player, the Studio and snapshots agree.
 */

declare const PITCH_RECT: Rect;
interface CameraCtx {
    size: {
        w: number;
        h: number;
    };
    /** The stage's camera focus. */
    focus: Rect;
    /** Player positions at time t (for follow shots). */
    posAt: (t: number) => Record<string, P>;
}
/** The camera at time t: each camera cue eases from wherever the camera was when it started. */
declare function cameraAt(cues: readonly Cue[], t: number, base: ViewBox, ctx: CameraCtx): ViewBox;
/** Playback speed at t from slow-motion cues (1 when none is running). */
declare function speedAt(cues: readonly Cue[], t: number): number;
type SpotOn = {
    zone: Zone;
} | {
    players: string[];
};
interface Spot {
    on: SpotOn;
    /** Darkness outside the lit area, 0..0.9. */
    alpha: number;
}
/** Spotlight at t. It stays on until another spotlight step changes it (on: null switches it off). */
declare function spotlightAt(cues: readonly Cue[], t: number): Spot | null;
/** Players pulsing at t. */
declare function pulsingAt(cues: readonly Cue[], t: number): string[];
/** Zones revealed so far (they stay), with their fade-in. */
declare function revealsAt(cues: readonly Cue[], t: number): {
    zone: Zone;
    alpha: number;
}[];
/** Caption showing at t. */
declare function captionAt(cues: readonly Cue[], t: number): Localized | null;
declare function zoneShape(z: Zone, snap: Parameters<typeof resolveLandmark>[1]): Shape | null;
/** Hints reached after `wrong` wrong tries; the highest level's text shows, the rest accumulates. */
interface HintState {
    level: number;
    text: Localized | null;
    showZones: boolean;
    reveal: Zone[];
    pulse: string[];
    spotlight: SpotOn | null;
    ghost: boolean;
}
declare function hintState(hints: readonly Hint[] | undefined, wrong: number): HintState;
/** XP after hints: each level used costs 25 %, never below 25 %. */
declare const xpAfterHints: (xp: number, levelsUsed: number) => number;

declare const MoveStep: z.ZodObject<{
    kind: z.ZodLiteral<"move">;
    who: z.ZodString;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        landmark: z.ZodString;
        offset: z.ZodOptional<z.ZodObject<{
            dmx: z.ZodNumber;
            dmy: z.ZodNumber;
        }, z.core.$strict>>;
        resolvedAt: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    face: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodLiteral<"ball">]>>;
}, z.core.$strict>;
declare const RunPathStep: z.ZodObject<{
    kind: z.ZodLiteral<"run_path">;
    who: z.ZodString;
    path: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PassStep: z.ZodObject<{
    kind: z.ZodLiteral<"pass">;
    from: z.ZodString;
    to: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    lofted: z.ZodOptional<z.ZodBoolean>;
    interceptedBy: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
declare const ShootStep: z.ZodObject<{
    kind: z.ZodLiteral<"shoot">;
    from: z.ZodString;
    target: z.ZodUnion<readonly [z.ZodLiteral<"goal">, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
    result: z.ZodEnum<{
        goal: "goal";
        save: "save";
        wide: "wide";
    }>;
}, z.core.$strict>;
declare const RushStep: z.ZodObject<{
    kind: z.ZodLiteral<"rush">;
    who: z.ZodString;
    at: z.ZodString;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const FlagStep: z.ZodObject<{
    kind: z.ZodLiteral<"flag">;
    reason: z.ZodLiteral<"offside">;
}, z.core.$strict>;
declare const WaitStep: z.ZodObject<{
    kind: z.ZodLiteral<"wait">;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Replays the child's own answer (their drag, drawn run with its timed pass, or pass sequence). */
declare const PlayAnswerStep: z.ZodObject<{
    kind: z.ZodLiteral<"play_answer">;
    ms: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/** Zoom or pan: to an area, to the whole pitch, back to the task camera, or following a player. */
declare const CameraStep: z.ZodObject<{
    kind: z.ZodLiteral<"camera">;
    to: z.ZodUnion<readonly [z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>, z.ZodObject<{
        preset: z.ZodEnum<{
            pitch: "pitch";
            focus: "focus";
        }>;
    }, z.core.$strict>, z.ZodObject<{
        follow: z.ZodString;
        widthM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
/** Dim everything except an area or some players. `on: null` turns the spotlight off. */
declare const SpotlightStep: z.ZodObject<{
    kind: z.ZodLiteral<"spotlight">;
    on: z.ZodUnion<readonly [z.ZodObject<{
        zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>;
    }, z.core.$strict>, z.ZodObject<{
        players: z.ZodArray<z.ZodString>;
    }, z.core.$strict>, z.ZodNull]>;
    dim: z.ZodOptional<z.ZodNumber>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const PulseStep: z.ZodObject<{
    kind: z.ZodLiteral<"pulse">;
    who: z.ZodArray<z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const RevealStep: z.ZodObject<{
    kind: z.ZodLiteral<"reveal">;
    zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        x0: z.ZodNumber;
        x1: z.ZodNumber;
        y0: z.ZodNumber;
        y1: z.ZodNumber;
    }, z.core.$strict>]>;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const SlowmoStep: z.ZodObject<{
    kind: z.ZodLiteral<"slowmo">;
    factor: z.ZodNumber;
    ms: z.ZodNumber;
}, z.core.$strict>;
declare const CaptionStep: z.ZodObject<{
    kind: z.ZodLiteral<"caption">;
    text: z.ZodRecord<z.ZodString, z.ZodString>;
    ms: z.ZodNumber;
}, z.core.$strict>;
type DirectorStep = z.infer<typeof CameraStep> | z.infer<typeof SpotlightStep> | z.infer<typeof PulseStep> | z.infer<typeof RevealStep> | z.infer<typeof SlowmoStep> | z.infer<typeof CaptionStep>;
type Step = z.infer<typeof MoveStep> | z.infer<typeof RunPathStep> | z.infer<typeof PassStep> | z.infer<typeof ShootStep> | z.infer<typeof RushStep> | z.infer<typeof FlagStep> | z.infer<typeof WaitStep> | z.infer<typeof PlayAnswerStep> | DirectorStep | GroupStep;
interface Script {
    mode: "sequential" | "parallel";
    steps: Step[];
}
type GroupStep = {
    kind: "group";
    script: Script;
};
declare const GroupStep: z.ZodType<GroupStep>;
declare const LessonSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    id: z.ZodString;
    meta: z.ZodObject<{
        title: z.ZodRecord<z.ZodString, z.ZodString>;
        topic: z.ZodString;
        level: z.ZodEnum<{
            recognize: "recognize";
            decide: "decide";
            execute: "execute";
            defend: "defend";
            "game-speed": "game-speed";
        }>;
        difficulty: z.ZodNumber;
        ageBand: z.ZodEnum<{
            "9-10": "9-10";
            "11-13": "11-13";
        }>;
        positions: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            GK: "GK";
            DEF: "DEF";
            MID: "MID";
            ATT: "ATT";
        }>>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        status: z.ZodEnum<{
            draft: "draft";
            review: "review";
            approved: "approved";
            archived: "archived";
        }>;
        source: z.ZodEnum<{
            coach: "coach";
            ai: "ai";
            "ai+coach": "ai+coach";
        }>;
        author: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.core.$strict>>;
        checkedAt: z.ZodOptional<z.ZodISODateTime>;
        render: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            passed: "passed";
            failed: "failed";
        }>>;
        template: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    scene: z.ZodObject<{
        camera: z.ZodObject<{
            focus: z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>;
        }, z.core.$strict>;
        players: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            team: z.ZodEnum<{
                home: "home";
                away: "away";
            }>;
            number: z.ZodNumber;
            role: z.ZodOptional<z.ZodString>;
            at: z.ZodUnion<readonly [z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>;
            facing: z.ZodNumber;
            isGK: z.ZodOptional<z.ZodBoolean>;
            highlight: z.ZodOptional<z.ZodBoolean>;
            behaviour: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"static">;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"follow">;
                target: z.ZodString;
                gapM: z.ZodNumber;
                speedMps: z.ZodOptional<z.ZodNumber>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"holdLine">;
                withIds: z.ZodArray<z.ZodString>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"press">;
                target: z.ZodString;
                speedMps: z.ZodNumber;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>, z.ZodObject<{
                kind: z.ZodLiteral<"cover">;
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
                when: z.ZodOptional<z.ZodEnum<{
                    outcomes: "outcomes";
                    always: "always";
                }>>;
            }, z.core.$strict>], "kind">>;
        }, z.core.$strict>>;
        ball: z.ZodUnion<readonly [z.ZodObject<{
            at: z.ZodUnion<readonly [z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>;
        }, z.core.$strict>, z.ZodObject<{
            holder: z.ZodString;
        }, z.core.$strict>]>;
        overlays: z.ZodOptional<z.ZodArray<z.ZodObject<{
            landmark: z.ZodString;
            style: z.ZodOptional<z.ZodEnum<{
                zone: "zone";
                hint: "hint";
                line: "line";
            }>>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>;
    intro: z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>;
    interaction: z.ZodObject<{
        type: z.ZodEnum<{
            path: "path";
            drag: "drag";
            pass_sequence: "pass_sequence";
            choose: "choose";
            tap_target: "tap_target";
        }>;
        who: z.ZodArray<z.ZodString>;
        allowRotate: z.ZodOptional<z.ZodBoolean>;
        bounds: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>, z.ZodObject<{
            landmark: z.ZodString;
            offset: z.ZodOptional<z.ZodObject<{
                dmx: z.ZodNumber;
                dmy: z.ZodNumber;
            }, z.core.$strict>>;
            resolvedAt: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>;
        }, z.core.$strict>]>>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            at: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
        path: z.ZodOptional<z.ZodObject<{
            maxLengthM: z.ZodOptional<z.ZodNumber>;
            runSpeedMps: z.ZodOptional<z.ZodNumber>;
            passAfterM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        tapRadiusM: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>;
    rules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>;
            toleranceM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"in_zone">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
            clearanceM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"lane_open">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"sees">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            defender: z.ZodString;
            minDeg: z.ZodNumber;
            maxDeg: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"diagonal_behind">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            passAfterM: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"onside_at_pass">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            minM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"path_clear">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            order: z.ZodOptional<z.ZodArray<z.ZodString>>;
            anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"sequence">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
                team: z.ZodEnum<{
                    home: "home";
                    away: "away";
                }>;
            }, z.core.$strict>]>;
            m: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"min_distance">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>;
            m: z.ZodNumber;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"max_distance">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            who: z.ZodString;
            presser: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"out_of_shadow">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            presser: z.ZodString;
            target: z.ZodString;
            lengthM: z.ZodOptional<z.ZodNumber>;
            halfAngle: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"in_shadow">;
    }, z.core.$strict>, z.ZodObject<{
        params: z.ZodObject<{
            correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
        }, z.core.$strict>;
        failKey: z.ZodString;
        weight: z.ZodOptional<z.ZodEnum<{
            must: "must";
            soft: "soft";
        }>>;
        type: z.ZodLiteral<"picks">;
    }, z.core.$strict>], "type">>;
    solution: z.ZodObject<{
        moves: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            at: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>;
            facing: z.ZodOptional<z.ZodNumber>;
            path: z.ZodOptional<z.ZodArray<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>>>;
        }, z.core.$strict>>>;
        sequence: z.ZodOptional<z.ZodArray<z.ZodString>>;
        pick: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strict>]>>;
        tolerance: z.ZodObject<{
            radiusM: z.ZodNumber;
            facingDeg: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
    }, z.core.$strict>;
    outcomes: z.ZodObject<{
        success: z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>;
        fail: z.ZodUnion<readonly [z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>, z.ZodRecord<z.ZodString, z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>>]>;
    }, z.core.$strict>;
    text: z.ZodObject<{
        banner: z.ZodRecord<z.ZodString, z.ZodString>;
        hint: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        fail: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>;
        almost: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        success: z.ZodRecord<z.ZodString, z.ZodString>;
        lessonLine: z.ZodRecord<z.ZodString, z.ZodString>;
    }, z.core.$strict>;
    rewards: z.ZodObject<{
        xp: z.ZodNumber;
        speedBonus: z.ZodOptional<z.ZodObject<{
            underSeconds: z.ZodNumber;
            xp: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    timing: z.ZodOptional<z.ZodObject<{
        introMs: z.ZodOptional<z.ZodNumber>;
        timeLimitMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        afterWrong: z.ZodNumber;
        text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        showZones: z.ZodOptional<z.ZodBoolean>;
        reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            x0: z.ZodNumber;
            x1: z.ZodNumber;
            y0: z.ZodNumber;
            y1: z.ZodNumber;
        }, z.core.$strict>]>>>;
        pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
        spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
            zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>;
        }, z.core.$strict>, z.ZodObject<{
            players: z.ZodArray<z.ZodString>;
        }, z.core.$strict>]>>;
        ghost: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>>;
    stages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        camera: z.ZodObject<{
            focus: z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>;
        }, z.core.$strict>;
        overlays: z.ZodOptional<z.ZodArray<z.ZodObject<{
            landmark: z.ZodString;
            style: z.ZodOptional<z.ZodEnum<{
                zone: "zone";
                hint: "hint";
                line: "line";
            }>>;
            label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>>>;
        intro: z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>;
        interaction: z.ZodObject<{
            type: z.ZodEnum<{
                path: "path";
                drag: "drag";
                pass_sequence: "pass_sequence";
                choose: "choose";
                tap_target: "tap_target";
            }>;
            who: z.ZodArray<z.ZodString>;
            allowRotate: z.ZodOptional<z.ZodBoolean>;
            bounds: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>, z.ZodObject<{
                landmark: z.ZodString;
                offset: z.ZodOptional<z.ZodObject<{
                    dmx: z.ZodNumber;
                    dmy: z.ZodNumber;
                }, z.core.$strict>>;
                resolvedAt: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
            }, z.core.$strict>]>>;
            options: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                at: z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>;
                label: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, z.core.$strict>>>;
            path: z.ZodOptional<z.ZodObject<{
                maxLengthM: z.ZodOptional<z.ZodNumber>;
                runSpeedMps: z.ZodOptional<z.ZodNumber>;
                passAfterM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>>;
            tapRadiusM: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>;
        rules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
                toleranceM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"in_zone">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                clearanceM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"lane_open">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                targets: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>]>>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"sees">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                defender: z.ZodString;
                minDeg: z.ZodNumber;
                maxDeg: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"diagonal_behind">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                passAfterM: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"onside_at_pass">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                minM: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"path_clear">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                order: z.ZodOptional<z.ZodArray<z.ZodString>>;
                anyOf: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"sequence">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                from: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>, z.ZodObject<{
                    team: z.ZodEnum<{
                        home: "home";
                        away: "away";
                    }>;
                }, z.core.$strict>]>;
                m: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"min_distance">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                to: z.ZodUnion<readonly [z.ZodString, z.ZodLiteral<"ball">, z.ZodString, z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>]>;
                m: z.ZodNumber;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"max_distance">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                who: z.ZodString;
                presser: z.ZodString;
                lengthM: z.ZodOptional<z.ZodNumber>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"out_of_shadow">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                presser: z.ZodString;
                target: z.ZodString;
                lengthM: z.ZodOptional<z.ZodNumber>;
                halfAngle: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"in_shadow">;
        }, z.core.$strict>, z.ZodObject<{
            params: z.ZodObject<{
                correct: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>;
            }, z.core.$strict>;
            failKey: z.ZodString;
            weight: z.ZodOptional<z.ZodEnum<{
                must: "must";
                soft: "soft";
            }>>;
            type: z.ZodLiteral<"picks">;
        }, z.core.$strict>], "type">>;
        solution: z.ZodObject<{
            moves: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                at: z.ZodOptional<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>;
                facing: z.ZodOptional<z.ZodNumber>;
                path: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    x: z.ZodNumber;
                    y: z.ZodNumber;
                }, z.core.$strict>>>;
            }, z.core.$strict>>>;
            sequence: z.ZodOptional<z.ZodArray<z.ZodString>>;
            pick: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
            }, z.core.$strict>]>>;
            tolerance: z.ZodObject<{
                radiusM: z.ZodNumber;
                facingDeg: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>;
        }, z.core.$strict>;
        outcomes: z.ZodObject<{
            success: z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>;
            fail: z.ZodUnion<readonly [z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>, z.ZodRecord<z.ZodString, z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>>]>;
        }, z.core.$strict>;
        text: z.ZodObject<{
            success: z.ZodRecord<z.ZodString, z.ZodString>;
            hint: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            banner: z.ZodRecord<z.ZodString, z.ZodString>;
            fail: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>>;
            almost: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strict>;
        hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            afterWrong: z.ZodNumber;
            text: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            showZones: z.ZodOptional<z.ZodBoolean>;
            reveal: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                x0: z.ZodNumber;
                x1: z.ZodNumber;
                y0: z.ZodNumber;
                y1: z.ZodNumber;
            }, z.core.$strict>]>>>;
            pulse: z.ZodOptional<z.ZodArray<z.ZodString>>;
            spotlight: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
                zone: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
                    x0: z.ZodNumber;
                    x1: z.ZodNumber;
                    y0: z.ZodNumber;
                    y1: z.ZodNumber;
                }, z.core.$strict>]>;
            }, z.core.$strict>, z.ZodObject<{
                players: z.ZodArray<z.ZodString>;
            }, z.core.$strict>]>>;
            ghost: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>>;
        timing: z.ZodOptional<z.ZodObject<{
            timeLimitMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    finale: z.ZodOptional<z.ZodType<Script, unknown, z.core.$ZodTypeInternals<Script, unknown>>>;
}, z.core.$strict>;
type Lesson = z.infer<typeof LessonSchema>;

type IssueCode = "schema" | "version" | "reference" | "landmark" | "shape" | "policy";
interface Issue {
    code: IssueCode;
    /** Path into the JSON, e.g. ["rules", 2, "params", "who"]. */
    path: (string | number)[];
    message: string;
}
type ValidationResult<T> = {
    ok: true;
    value: T;
    issues: [];
} | {
    ok: false;
    value?: undefined;
    issues: Issue[];
};
declare const formatPath: (path: readonly (string | number)[]) => string;
/** Full lesson validation: version, schema, then cross-references. */
declare function validateLesson(raw: unknown): ValidationResult<Lesson>;

export { type AttemptEvent, Ball, COLORS, type CompleteEvent, Ghost, type HintState, type Issue, type Lesson, LessonPlayer, type LessonPlayerProps, OptionMark, PITCH_RECT, PLAYER_CSS, PassLine, Pitch, type PlayerAssets, type Pos, RotateHandle, RunPath, SOUND_KEYS, type SoundKey, Sounds, type Spot, type SpotOn, Token, type TokenMeta, UI, type ViewBox, cameraAt, captionAt, clientToPitch, formatPath, hintState, injectCss, pulsingAt, rectAround, revealsAt, shapeToSvg, speedAt, spotlightAt, t, validateLesson, viewBoxFor, xpAfterHints, zoneShape };
