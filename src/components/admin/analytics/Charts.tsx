"use client"

import { useId, useState } from "react"

// Admin analytics charts. Colours come from the --viz-* tokens in globals.css (validated
// colour-blind safe, light and dark). Every chart has a legend or direct labels, a hover
// readout, and the page offers a table view, so colour never carries meaning alone.

const nf = new Intl.NumberFormat("el-GR")
const fmt = (n: number) => nf.format(n)

export type DailyPoint = { day: string; pageviews: number; visitors: number; clicks: number }

function dayLabel(day: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("el-GR", opts).format(new Date(`${day}T12:00:00Z`))
}

/** A round axis maximum (1, 2, 5 × 10ⁿ) at or above the data's max. */
function niceMax(max: number) {
  if (max <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(max))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s * 4 >= max) ?? 10 * pow
  return step * 4
}

// ─── Traffic: page views (area) + visitors (line) ───────────

export function TrafficChart({ data }: { data: DailyPoint[] }) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)
  const W = 1000
  const H = 260
  const top = niceMax(Math.max(...data.map((d) => d.pageviews), 1))
  const n = data.length
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (v: number) => H - (v / top) * H
  const line = (key: "pageviews" | "visitors") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ")
  const area = `${line("pageviews")} L${x(n - 1)},${H} L${x(0)},${H} Z`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(top * f))
  const labelEvery = Math.max(1, Math.ceil(n / 7))
  const active = hover ?? null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--fg-2)" }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--viz-1)" }} /> Page views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: "var(--viz-2)" }} /> Visitors
        </span>
      </div>
      <div className="relative flex gap-3">
        {/* y axis */}
        <div className="relative w-8 shrink-0 text-right text-[11px] tabular-nums" style={{ color: "var(--fg-3)", height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t / top) * 100}%` }}>
              {fmt(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height: H }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label="Page views and visitors per day"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1))
              setHover(Math.min(n - 1, Math.max(0, i)))
            }}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" style={{ stopColor: "var(--viz-1)", stopOpacity: 0.28 }} />
                <stop offset="100%" style={{ stopColor: "var(--viz-1)", stopOpacity: 0.02 }} />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--border)" }} strokeDasharray={t === 0 ? undefined : "3 4"} />
            ))}
            <path d={area} fill={`url(#${gradientId})`} />
            <path d={line("pageviews")} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinejoin="round" style={{ stroke: "var(--viz-1)" }} />
            <path d={line("visitors")} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinejoin="round" style={{ stroke: "var(--viz-2)" }} />
            {active !== null && (
              <line x1={x(active)} x2={x(active)} y1={0} y2={H} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--fg-3)" }} strokeDasharray="2 3" />
            )}
          </svg>
          {/* Markers in HTML so they stay round on a stretched SVG */}
          {active !== null &&
            (["pageviews", "visitors"] as const).map((key, k) => (
              <span
                key={key}
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${(x(active) / W) * 100}%`,
                  top: `${(y(data[active][key]) / H) * 100}%`,
                  backgroundColor: k === 0 ? "var(--viz-1)" : "var(--viz-2)",
                  boxShadow: "0 0 0 2px var(--bg-2)",
                }}
              />
            ))}
          {active !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-lg px-3 py-2 text-xs shadow-lg"
              style={{
                left: `${(x(active) / W) * 100}%`,
                transform: active > n / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                backgroundColor: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
              }}
            >
              <p className="mb-1.5 font-semibold">{dayLabel(data[active].day, { weekday: "short", day: "numeric", month: "short" })}</p>
              {[
                ["Page views", data[active].pageviews, "var(--viz-1)"],
                ["Visitors", data[active].visitors, "var(--viz-2)"],
                ["Banner clicks", data[active].clicks, "var(--fg-3)"],
              ].map(([label, value, color]) => (
                <p key={label as string} className="flex items-center justify-between gap-4 tabular-nums">
                  <span className="flex items-center gap-1.5" style={{ color: "var(--fg-2)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color as string }} />
                    {label}
                  </span>
                  <span className="font-semibold">{fmt(value as number)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* x axis */}
      <div className="relative ml-11 mt-2 h-4 text-[11px]" style={{ color: "var(--fg-3)" }}>
        {data.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <span
              key={d.day}
              className="absolute whitespace-nowrap"
              style={{
                left: `${(x(i) / W) * 100}%`,
                transform: i === 0 && n > 1 ? "none" : i === n - 1 && n > 1 ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {dayLabel(d.day)}
            </span>
          ) : null
        )}
      </div>
    </div>
  )
}

// ─── Sparkline (KPI cards) ──────────────────────────────────

export function Sparkline({ values, color = "var(--viz-1)" }: { values: number[]; color?: string }) {
  const gradientId = useId()
  if (values.length < 2) return null
  const W = 120
  const H = 36
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 2 - (v / max) * (H - 4)])
  const d = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${gradientId})`} />
      <path d={d} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" style={{ stroke: color }} />
    </svg>
  )
}

// ─── Donut (device split) ───────────────────────────────────

const SLICE_COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)"]

export function Donut({ slices }: { slices: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (total === 0) return <p className="text-sm" style={{ color: "var(--fg-3)" }}>No visits yet.</p>

  const R = 52
  const C = 2 * Math.PI * R
  const GAP = slices.length > 1 ? 3 : 0 // surface gap between segments
  const lengths = slices.map((s) => (s.value / total) * C)
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))
  const shown = hover ?? 0

  return (
    // Legend under the donut: the devices card is narrow in the three-column layout.
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Visitors by device">
          <circle cx={70} cy={70} r={R} fill="none" strokeWidth={16} style={{ stroke: "var(--bg-3)" }} />
          {slices.map((s, i) => {
            const dash = Math.max(0, lengths[i] - GAP)
            return (
              <circle
                key={s.label}
                cx={70}
                cy={70}
                r={R}
                fill="none"
                strokeWidth={hover === i ? 20 : 16}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offsets[i]}
                style={{ stroke: SLICE_COLORS[i % SLICE_COLORS.length], transition: "stroke-width 150ms" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tabular-nums" style={{ color: "var(--fg)" }}>
            {Math.round((slices[shown].value / total) * 100)}%
          </span>
          <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>{slices[shown].label}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {slices.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center justify-between gap-3 text-sm"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex items-center gap-2" style={{ color: "var(--fg)" }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
              {s.label}
            </span>
            <span className="whitespace-nowrap tabular-nums" style={{ color: "var(--fg-2)" }}>
              {fmt(s.value)} <span style={{ color: "var(--fg-3)" }}>· {Math.round((s.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
