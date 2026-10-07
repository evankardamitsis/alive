import type { PromoBanner, PromoBannerCategoryScope, PromoBannerFormat } from "@/types"

// Shared (client + server safe) helpers for promo banners.

export const PROMO_BANNERS_CACHE_TAG = "promo-banners"

export const PROMO_FORMATS: { value: PromoBannerFormat; label: string; description: string }[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Inline banner — sticky side rails on desktop, between the feed items on mobile.",
  },
  {
    value: "prestitial",
    label: "Prestitial",
    description: "Full-screen takeover before the visitor sees the page. First page of the visit, once per session.",
  },
  {
    value: "interstitial",
    label: "Interstitial",
    description: "Full-screen takeover between pages, when the visitor navigates inside the site. Once per session.",
  },
  {
    value: "special_boost",
    label: "Special Boost",
    description: "Full-screen popup with the visual on page load. Once per day per visitor.",
  },
]

export const PROMO_FORMAT_LABELS: Record<PromoBannerFormat, string> = Object.fromEntries(
  PROMO_FORMATS.map((f) => [f.value, f.label])
) as Record<PromoBannerFormat, string>

export const PROMO_CATEGORY_SCOPES: PromoBannerCategoryScope[] = ["none", "all", "selected"]

/** Fields the public site needs — keeps admin-only data (name, timestamps) out of the HTML. */
export type PublicPromoBanner = Pick<
  PromoBanner,
  | "id"
  | "image_url"
  | "image_width"
  | "image_height"
  | "mobile_image_url"
  | "mobile_image_width"
  | "mobile_image_height"
  | "alt_text"
  | "destination_url"
  | "format"
  | "show_on_home"
  | "category_scope"
  | "category_ids"
>

/** Where a banner is being rendered. */
export type PromoPage = { type: "home" } | { type: "category"; categoryId: string }

export function bannerTargetsPage(banner: PublicPromoBanner, page: PromoPage): boolean {
  if (page.type === "home") return banner.show_on_home
  if (banner.category_scope === "all") return true
  if (banner.category_scope === "selected") return banner.category_ids.includes(page.categoryId)
  return false
}

export function isFullscreenFormat(format: PromoBannerFormat) {
  return format !== "standard"
}

export type PromoBannerStatus = "live" | "scheduled" | "expired" | "paused"

export function promoBannerStatus(
  banner: Pick<PromoBanner, "is_active" | "starts_at" | "ends_at">,
  now = new Date()
): PromoBannerStatus {
  if (!banner.is_active) return "paused"
  if (new Date(banner.starts_at) > now) return "scheduled"
  if (new Date(banner.ends_at) <= now) return "expired"
  return "live"
}

/** True when the destination leaves the site (opens in a new tab). */
export function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

export function isGifUrl(url: string) {
  return /\.gif($|\?)/i.test(url)
}
