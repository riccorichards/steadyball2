// components/admin/charts.tsx  (NEW FILE)
//
// Small, dependency-free chart pieces for the admin dashboard (plain HTML, render on the server).
// One hue for every single-series chart; values and labels stay in text colors; hover any bar
// for its exact number.

import type { ReactNode } from "react";

const BAR = "bg-cyan-400";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-5 ${className}`}
    >
      <h2 className="text-sm font-bold text-slate-200">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Headline number. */
export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums text-white">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export interface BarRow {
  key: string;
  label: ReactNode;
  value: number;
  /** Text shown at the right end of the row, e.g. "52 · 87%". Defaults to the value. */
  display?: string;
  /** Hover text. */
  title?: string;
}

/** Horizontal bars, all sharing one scale. */
export function BarList({
  rows,
  max,
}: {
  rows: BarRow[];
  max?: number;
}): React.JSX.Element {
  const top = Math.max(1, max ?? Math.max(...rows.map((r) => r.value), 0));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const pct = (r.value / top) * 100;
        return (
          <li
            key={r.key}
            title={r.title ?? `${r.value}`}
            className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] sm:grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm"
          >
            <span className="truncate text-slate-300">{r.label}</span>
            <span className="h-2.5 rounded-r-[4px] bg-white/[0.06]">
              <span
                className={`block h-full rounded-r-[4px] ${BAR}`}
                style={{ width: `${r.value > 0 ? Math.max(pct, 1.5) : 0}%` }}
              />
            </span>
            <span className="min-w-[4rem] text-right font-semibold tabular-nums text-slate-200">
              {r.display ?? r.value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export interface Column {
  key: string;
  label: string;
  value: number;
  title: string;
}

/** Vertical columns on a shared baseline. `labelEvery`: show an x label every N columns (first/last always). */
export function ColumnChart({
  columns,
  labelEvery = 1,
  height = 140,
}: {
  columns: Column[];
  labelEvery?: number;
  height?: number;
}): React.JSX.Element {
  const top = Math.max(1, ...columns.map((c) => c.value));
  return (
    <div>
      <div className="relative" style={{ height }}>
        {/* recessive gridline + max value */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/10" />
        <span className="absolute -top-2.5 right-0 bg-slate-950 pl-1 text-[10px] tabular-nums text-slate-500">
          {top}
        </span>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {columns.map((c) => (
            <div
              key={c.key}
              title={c.title}
              className="group flex h-full flex-1 items-end"
            >
              <div
                className={`w-full rounded-t-[4px] ${BAR} transition-opacity group-hover:opacity-80`}
                style={{
                  height:
                    c.value > 0 ? `${Math.max((c.value / top) * 100, 2)}%` : 0,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* x labels: absolutely placed under their column, so short columns never truncate them */}
      <div className="relative mt-1.5 h-4">
        {columns.map((c, i) => {
          const last = columns.length - 1;
          if (!(i === 0 || i === last || i % labelEvery === 0)) return null;
          if (labelEvery > 1 && i !== last && last - i < labelEvery / 2)
            return null; // avoid crowding the last label
          const center = ((i + 0.5) / columns.length) * 100;
          const align =
            labelEvery > 1 && i === 0
              ? "translate-x-0"
              : labelEvery > 1 && i === last
                ? "-translate-x-full"
                : "-translate-x-1/2";
          const left =
            labelEvery > 1 && i === 0
              ? "0%"
              : labelEvery > 1 && i === last
                ? "100%"
                : `${center}%`;
          return (
            <span
              key={c.key}
              className={`absolute top-0 whitespace-nowrap text-[10px] tabular-nums text-slate-500 ${align}`}
              style={{ left }}
            >
              {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
