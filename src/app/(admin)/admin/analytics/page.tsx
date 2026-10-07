import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Eye, Megaphone, MousePointerClick, Users } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { PROMO_FORMAT_LABELS, promoBannerStatus } from "@/lib/promo-banners"
import { Donut, Sparkline, TrafficChart, type DailyPoint } from "@/components/admin/analytics/Charts"
import type { PromoBanner } from "@/types"

export const revalidate = 0

const RANGES = [
  { key: "1", label: "Today", days: 1 },
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
] as const

const PLACEMENT_LABELS: Record<string, string> = {
  rail: "Side rail",
  feed: "In feed",
  article: "In article",
  sidebar: "Sidebar",
  prestitial: "Prestitial",
  interstitial: "Interstitial",
  special_boost: "Special Boost",
}

const DAY_MS = 24 * 60 * 60 * 1000

type Totals = { pageviews: number; visitors: number; impressions: number; clicks: number }
type TopPage = { path: string; pageviews: number; visitors: number }
type Referrer = { referrer: string; visitors: number }
type Device = { device: string; visitors: number }
type BannerStat = { banner_id: string; placement: string | null; impressions: number; clicks: number }
type BannerInfo = Pick<PromoBanner, "id" | "name" | "format" | "image_url" | "is_active" | "starts_at" | "ends_at">

const nf = new Intl.NumberFormat("el-GR")
const fmt = (n: number) => nf.format(n)
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null)
const count = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`

function athensDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(date)
}

/** Midnight (Athens) at the start of the range: today minus (days - 1). */
function rangeStart(days: number) {
  const today = athensDay(new Date())
  // Athens is UTC+2 or +3: take whichever offset puts midnight on today's date.
  const midnight = [2, 3]
    .map((h) => new Date(`${today}T00:00:00+0${h}:00`))
    .find((d) => athensDay(d) === today && athensDay(new Date(d.getTime() - 1)) !== today)!
  return new Date(midnight.getTime() - (days - 1) * DAY_MS)
}

function fillDays(rows: DailyPoint[], from: Date, days: number): DailyPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r]))
  return Array.from({ length: days }, (_, i) => {
    const day = athensDay(new Date(from.getTime() + i * DAY_MS + DAY_MS / 2))
    const r = byDay.get(day)
    return {
      day,
      pageviews: Number(r?.pageviews ?? 0),
      visitors: Number(r?.visitors ?? 0),
      clicks: Number(r?.clicks ?? 0),
    }
  })
}

function toTotals(row: Partial<Totals> | undefined): Totals {
  return {
    pageviews: Number(row?.pageviews ?? 0),
    visitors: Number(row?.visitors ?? 0),
    impressions: Number(row?.impressions ?? 0),
    clicks: Number(row?.clicks ?? 0),
  }
}

// ─── Pieces ─────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--fg)" }}>{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: "var(--fg-3)" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Change vs the previous period of the same length. Arrow + text, so colour isn't the only signal. */
function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="text-xs" style={{ color: "var(--fg-3)" }}>No change</span>
  if (before === 0) return <span className="text-xs" style={{ color: "var(--fg-3)" }}>New this period</span>
  const change = ((now - before) / before) * 100
  const up = change >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--fg-2)" }}>
      <Icon size={14} style={{ color: up ? "var(--viz-good)" : "var(--viz-bad)" }} aria-hidden />
      {up ? "+" : "−"}
      {Math.abs(change).toFixed(change !== 0 && Math.abs(change) < 10 ? 1 : 0)}%
      <span style={{ color: "var(--fg-3)" }}>vs previous</span>
    </span>
  )
}

function Kpi({
  label,
  icon: Icon,
  value,
  now,
  before,
  spark,
  sparkColor,
  footnote,
}: {
  label: string
  icon: typeof Eye
  value: string
  now: number
  before: number
  spark?: number[]
  sparkColor?: string
  footnote?: string
}) {
  return (
    <div
      className="flex flex-col justify-between gap-3 rounded-2xl p-5"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--bg-3)", color: "var(--fg-2)" }}>
          <Icon size={15} />
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: "var(--fg)" }}>{value}</p>
        <div className="mt-1">
          <Delta now={now} before={before} />
        </div>
      </div>
      {spark ? (
        <Sparkline values={spark} color={sparkColor} />
      ) : (
        <p className="flex h-9 items-end text-xs" style={{ color: "var(--fg-3)" }}>{footnote}</p>
      )}
    </div>
  )
}

/** Ranked rows with a proportional bar; values are labelled, so the bar is only a guide. */
function BarList({
  rows,
  empty,
  unit,
}: {
  rows: { key: string; label: React.ReactNode; value: number; sub?: string }[]
  empty: string
  unit: string
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm" style={{ color: "var(--fg-3)" }}>{empty}</p>
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div>
      <div className="mb-2 flex justify-between text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>
        <span>Name</span>
        <span>{unit}</span>
      </div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="relative overflow-hidden rounded-lg px-3 py-2 text-sm">
            <span
              className="absolute inset-y-0 left-0 rounded-lg"
              style={{
                width: `${Math.max(2, (r.value / max) * 100)}%`,
                backgroundColor: "color-mix(in srgb, var(--viz-1) 14%, transparent)",
              }}
            />
            <span className="relative flex items-center justify-between gap-3">
              <span className="min-w-0 truncate" style={{ color: "var(--fg)" }}>{r.label}</span>
              <span className="shrink-0 tabular-nums" style={{ color: "var(--fg)" }}>
                {fmt(r.value)}
                {r.sub && <span className="ml-1.5 text-xs" style={{ color: "var(--fg-3)" }}>{r.sub}</span>}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams
  const range = RANGES.find((r) => r.key === rangeParam) ?? RANGES[2]
  const from = rangeStart(range.days)
  const to = new Date()
  // Previous period of the same length, for the change figures.
  const prevFrom = new Date(from.getTime() - range.days * DAY_MS)
  const prevTo = new Date(to.getTime() - range.days * DAY_MS)
  const args = { p_from: from.toISOString(), p_to: to.toISOString() }

  const supabase = createAdminClient()
  const [totalsRes, prevRes, dailyRes, pagesRes, refRes, devRes, bannerRes, bannersRes] = await Promise.all([
    supabase.rpc("analytics_totals", args),
    supabase.rpc("analytics_totals", { p_from: prevFrom.toISOString(), p_to: prevTo.toISOString() }),
    supabase.rpc("analytics_daily", args),
    supabase.rpc("analytics_top_pages", { ...args, p_limit: 8 }),
    supabase.rpc("analytics_top_referrers", { ...args, p_limit: 6 }),
    supabase.rpc("analytics_devices", args),
    supabase.rpc("analytics_banner_stats", args),
    supabase.from("promo_banners").select("id, name, format, image_url, is_active, starts_at, ends_at"),
  ])

  const setupError = totalsRes.error
  const totals = toTotals(((totalsRes.data ?? []) as Totals[])[0])
  const prev = toTotals(((prevRes.data ?? []) as Totals[])[0])
  const daily = fillDays((dailyRes.data ?? []) as DailyPoint[], from, range.days)
  const pages = (pagesRes.data ?? []) as TopPage[]
  const referrers = (refRes.data ?? []) as Referrer[]
  const devices = (devRes.data ?? []) as Device[]
  const banners = new Map(((bannersRes.data ?? []) as BannerInfo[]).map((b) => [b.id, b]))

  const perBanner = new Map<string, { impressions: number; clicks: number; byPlacement: BannerStat[] }>()
  for (const s of (bannerRes.data ?? []) as BannerStat[]) {
    const e = perBanner.get(s.banner_id) ?? { impressions: 0, clicks: 0, byPlacement: [] }
    e.impressions += Number(s.impressions)
    e.clicks += Number(s.clicks)
    e.byPlacement.push(s)
    perBanner.set(s.banner_id, e)
  }
  const bannerRows = [...perBanner.entries()].sort((a, b) => b[1].impressions - a[1].impressions)
  const maxImpressions = Math.max(1, ...bannerRows.map(([, s]) => s.impressions))

  const ctrNow = pct(totals.clicks, totals.impressions)
  const ctrPrev = pct(prev.clicks, prev.impressions)
  const viewsPerVisitor = totals.visitors > 0 ? totals.pageviews / totals.visitors : 0

  const deviceOrder = ["mobile", "desktop", "tablet"]
  const deviceSlices = [...devices]
    .sort((a, b) => deviceOrder.indexOf(a.device) - deviceOrder.indexOf(b.device))
    .map((d) => ({
      label: d.device === "mobile" ? "Phone" : d.device === "tablet" ? "Tablet" : "Desktop",
      value: Number(d.visitors),
    }))

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>Analytics</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>
            Traffic and promo banner performance · first-party, cookie-less, no IPs stored
          </p>
        </div>
        <nav
          className="flex rounded-xl p-1"
          style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          aria-label="Date range"
        >
          {RANGES.map((r) => {
            const active = r.key === range.key
            return (
              <Link
                key={r.key}
                href={`/admin/analytics?range=${r.key}`}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  color: active ? "var(--bg)" : "var(--fg-2)",
                  backgroundColor: active ? "var(--fg)" : "transparent",
                }}
                aria-current={active ? "page" : undefined}
              >
                {r.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {setupError && (
        <p className="rounded-xl p-4 text-sm text-red-500" style={{ border: "1px solid var(--border)" }}>
          Analytics data is not available ({setupError.message}). Has the <code>0007_site_analytics</code> migration been
          applied?
        </p>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Page views"
          icon={Eye}
          value={fmt(totals.pageviews)}
          now={totals.pageviews}
          before={prev.pageviews}
          spark={range.days > 1 ? daily.map((d) => d.pageviews) : undefined}
          sparkColor="var(--viz-1)"
          footnote={`${viewsPerVisitor.toFixed(1)} pages per visitor`}
        />
        <Kpi
          label="Visitors"
          icon={Users}
          value={fmt(totals.visitors)}
          now={totals.visitors}
          before={prev.visitors}
          spark={range.days > 1 ? daily.map((d) => d.visitors) : undefined}
          sparkColor="var(--viz-2)"
          footnote="Unique per day, summed"
        />
        <Kpi
          label="Banner impressions"
          icon={Megaphone}
          value={fmt(totals.impressions)}
          now={totals.impressions}
          before={prev.impressions}
          footnote={
            totals.pageviews > 0
              ? `${(totals.impressions / totals.pageviews).toFixed(2)} per page view`
              : "Counted when half a banner is on screen"
          }
        />
        <Kpi
          label="Banner clicks"
          icon={MousePointerClick}
          value={fmt(totals.clicks)}
          now={totals.clicks}
          before={prev.clicks}
          spark={range.days > 1 ? daily.map((d) => d.clicks) : undefined}
          sparkColor="var(--viz-3)"
          footnote={ctrNow !== null ? `CTR ${ctrNow.toFixed(2)}%${ctrPrev !== null ? ` (was ${ctrPrev.toFixed(2)}%)` : ""}` : "No impressions yet"}
        />
      </div>

      {/* Traffic */}
      <Card
        title="Traffic"
        subtitle={`Page views and visitors per day · ${range.label.toLowerCase()}`}
        action={
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--fg-3)" }}>Busiest day</p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--fg)" }}>
              {(() => {
                const best = daily.reduce((a, b) => (b.pageviews > a.pageviews ? b : a), daily[0])
                return best.pageviews > 0
                  ? `${new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "short" }).format(new Date(`${best.day}T12:00:00Z`))} · ${fmt(best.pageviews)}`
                  : "—"
              })()}
            </p>
          </div>
        }
      >
        <TrafficChart data={daily} />
        <details className="mt-4 text-xs" style={{ color: "var(--fg-3)" }}>
          <summary className="cursor-pointer select-none">Show as table</summary>
          <table className="mt-2 w-full tabular-nums">
            <thead>
              <tr className="text-left">
                <th className="py-1 font-medium">Day</th>
                <th className="text-right font-medium">Page views</th>
                <th className="text-right font-medium">Visitors</th>
                <th className="text-right font-medium">Banner clicks</th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--fg-2)" }}>
              {daily.map((d) => (
                <tr key={d.day} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="py-1">{d.day}</td>
                  <td className="text-right">{fmt(d.pageviews)}</td>
                  <td className="text-right">{fmt(d.visitors)}</td>
                  <td className="text-right">{fmt(d.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>

      {/* Pages / devices / referrers */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Top pages" subtitle="Most viewed in this range" className="lg:col-span-2">
          <BarList
            unit="Views"
            empty="No page views in this range yet."
            rows={pages.map((p) => ({
              key: p.path,
              value: Number(p.pageviews),
              sub: count(Number(p.visitors), "visitor", "visitors"),
              label: (
                <a href={p.path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {p.path === "/" ? "Homepage" : decodeURIComponent(p.path)}
                </a>
              ),
            }))}
          />
        </Card>
        <div className="space-y-6">
          <Card title="Devices" subtitle="Visitors by screen">
            <Donut slices={deviceSlices} />
          </Card>
          <Card title="Referrers" subtitle="Where visitors came from">
            <BarList
              unit="Visitors"
              empty="No visits yet."
              rows={referrers.map((r) => ({ key: r.referrer, value: Number(r.visitors), label: r.referrer }))}
            />
          </Card>
        </div>
      </div>

      {/* Banners */}
      <Card
        title="Promo banners"
        subtitle="Impressions count once per page view when at least half the banner is on screen"
        action={
          <Link href="/admin/banners" className="text-xs font-semibold hover:underline" style={{ color: "var(--fg-2)" }}>
            Manage banners →
          </Link>
        }
      >
        {bannerRows.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: "var(--fg-3)" }}>
            No banner impressions or clicks in this range.
          </p>
        ) : (
          <ul className="space-y-3">
            {bannerRows.map(([id, s]) => {
              const b = banners.get(id)
              const status = b ? promoBannerStatus(b) : null
              const ctr = pct(s.clicks, s.impressions)
              return (
                <li
                  key={id}
                  className="grid items-center gap-4 rounded-xl p-3 sm:grid-cols-[72px_minmax(0,1fr)_220px_auto]"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div className="hidden h-12 w-[72px] items-center justify-center overflow-hidden rounded-md sm:flex" style={{ backgroundColor: "var(--bg-3)" }}>
                    {b?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.image_url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>{b?.name ?? "Deleted banner"}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs" style={{ color: "var(--fg-3)" }}>
                      {b && <span>{PROMO_FORMAT_LABELS[b.format]}</span>}
                      {status && <span className="capitalize">· {status}</span>}
                      {s.byPlacement.map((p) => (
                        <span key={p.placement ?? "other"}>
                          · {PLACEMENT_LABELS[p.placement ?? ""] ?? "Other"} {fmt(Number(p.impressions))}/{fmt(Number(p.clicks))}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs tabular-nums" style={{ color: "var(--fg-2)" }}>
                      <span>{count(s.impressions, "impression", "impressions")}</span>
                      <span>{count(s.clicks, "click", "clicks")}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-3)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(2, (s.impressions / maxImpressions) * 100)}%`, backgroundColor: "var(--viz-1)" }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums" style={{ color: "var(--fg)" }}>
                      {ctr !== null ? `${ctr.toFixed(2)}%` : "—"}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>CTR</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
