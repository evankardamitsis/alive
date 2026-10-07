import { createAdminClient } from "@/lib/supabase/admin"
import { BannerManager, type BannerTotals } from "@/components/admin/BannerManager"
import type { PromoBanner } from "@/types"

export const revalidate = 0

export default async function BannersPage() {
  const supabase = createAdminClient()
  const [{ data: banners, error }, { data: categories }, { data: stats }] = await Promise.all([
    supabase.from("promo_banners").select("*").order("starts_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug, color").order("name"),
    // All-time totals; empty until the 0007 analytics migration is applied.
    supabase.rpc("analytics_banner_stats", { p_from: null, p_to: null }),
  ])

  const totals: Record<string, BannerTotals> = {}
  for (const row of (stats ?? []) as { banner_id: string; impressions: number; clicks: number }[]) {
    const t = (totals[row.banner_id] ??= { impressions: 0, clicks: 0 })
    t.impressions += Number(row.impressions)
    t.clicks += Number(row.clicks)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Promo Banners</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>
          Visuals shown on the homepage, category and article pages: side rails on desktop, in the feed on mobile,
          or as full-screen takeovers.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-500">
          Could not load banners ({error.message}). Have the <code>0006</code> and <code>0007</code> migrations been
          applied?
        </p>
      ) : (
        <BannerManager
          initial={(banners ?? []) as PromoBanner[]}
          categories={categories ?? []}
          totals={totals}
        />
      )}
    </div>
  )
}
