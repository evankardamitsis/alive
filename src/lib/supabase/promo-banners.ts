import { unstable_cache } from "next/cache"
import { createPublicClient } from "./public"
import { PROMO_BANNERS_CACHE_TAG, type PublicPromoBanner } from "@/lib/promo-banners"

const PUBLIC_SELECT =
  "id, image_url, image_width, image_height, mobile_image_url, mobile_image_width, mobile_image_height, alt_text, destination_url, format, show_on_home, category_scope, category_ids"

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
  return (data ?? []) as PublicPromoBanner[]
}

/** All banners live right now, highest priority first. Cached for 60s and busted on admin edits. */
export async function getLivePromoBanners(): Promise<PublicPromoBanner[]> {
  return unstable_cache(fetchLivePromoBanners, ["getLivePromoBanners"], {
    tags: [PROMO_BANNERS_CACHE_TAG],
    revalidate: 60,
  })()
}
