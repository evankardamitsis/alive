import { unstable_cache } from "next/cache"
import { createPublicClient } from "./public"
import { createAdminClient } from "./admin"
import { ALL_PROMO_SPOTS, PROMO_BANNERS_CACHE_TAG, type PublicPromoBanner } from "@/lib/promo-banners"

const PUBLIC_SELECT =
  "id, image_url, image_width, image_height, mobile_image_url, mobile_image_width, mobile_image_height, alt_text, destination_url, format, formats, show_on_home, category_scope, category_ids, article_scope, device, placements, repeat_in_spots, priority, weight, max_impressions, max_clicks"

type LiveRow = PublicPromoBanner & { max_impressions: number | null; max_clicks: number | null }

/** All-time impression / click totals per banner, for banners that have a cap. */
async function bannerTotals(ids: string[]) {
  const totals = new Map<string, { impressions: number; clicks: number }>()
  if (ids.length === 0) return totals
  // site_events is service-role only; this runs on the server inside the cached fetch.
  const { data, error } = await createAdminClient().rpc("analytics_banner_stats", { p_from: null, p_to: null })
  if (error) {
    console.error("Failed to load promo banner totals:", error.message)
    return totals
  }
  for (const row of (data ?? []) as { banner_id: string; impressions: number; clicks: number }[]) {
    const t = totals.get(row.banner_id) ?? { impressions: 0, clicks: 0 }
    t.impressions += Number(row.impressions)
    t.clicks += Number(row.clicks)
    totals.set(row.banner_id, t)
  }
  return totals
}

async function fetchLivePromoBanners(): Promise<PublicPromoBanner[]> {
  const supabase = createPublicClient()
  const now = new Date().toISOString()
  // RLS already limits the public key to live banners; the filters keep this correct either way.
  const { data, error } = await supabase
    .from("promo_banners")
    .select(PUBLIC_SELECT)
    .eq("is_active", true)
    .lte("starts_at", now)
    .gt("ends_at", now)
    .order("priority", { ascending: false })
    .order("starts_at", { ascending: false })

  if (error) {
    // Promos must never take the site down (e.g. migration not applied yet).
    console.error("Failed to load promo banners:", error.message)
    return []
  }

  const rows = (data ?? []) as LiveRow[]
  const capped = rows.filter((b) => b.max_impressions != null || b.max_clicks != null)
  const totals = await bannerTotals(capped.map((b) => b.id))

  return rows
    .filter((b) => {
      const t = totals.get(b.id)
      if (!t) return true
      if (b.max_impressions != null && t.impressions >= b.max_impressions) return false
      if (b.max_clicks != null && t.clicks >= b.max_clicks) return false
      return true
    })
    // Caps are server-side only; keep them out of the page HTML.
    .map((row) => {
      // Rows cached before a column existed may lack it; fall back to the column's default.
      const banner: Partial<LiveRow> = { ...row, placements: row.placements ?? [...ALL_PROMO_SPOTS] }
      delete banner.max_impressions
      delete banner.max_clicks
      return banner as PublicPromoBanner
    })
}

/**
 * All banners live right now, highest priority first, minus any that reached their cap.
 * Cached for 60s and busted on admin edits, so a capped banner stops within about a minute.
 */
export async function getLivePromoBanners(): Promise<PublicPromoBanner[]> {
  // Bump the version when the selected columns change, so stale cached rows are never reused.
  return unstable_cache(fetchLivePromoBanners, ["getLivePromoBanners", "v4"], {
    tags: [PROMO_BANNERS_CACHE_TAG],
    revalidate: 60,
  })()
}
