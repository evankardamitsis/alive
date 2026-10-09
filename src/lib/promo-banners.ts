import type {
  PromoBanner,
  PromoBannerArticleScope,
  PromoBannerCategoryScope,
  PromoBannerDevice,
  PromoBannerFormat,
  PromoSpot,
} from "@/types"

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

export const PROMO_ARTICLE_SCOPES: [PromoBannerArticleScope, string][] = [
  ["none", "None"],
  ["all", "All articles"],
  ["categories", "Articles in the categories above"],
]

/** Spots a standard banner can use, in the order the admin lists them. */
export const PROMO_SPOTS: { value: PromoSpot; label: string; hint: string }[] = [
  { value: "rail", label: "Side rails", hint: "Left and right of the page on wide screens (1440px+)" },
  { value: "feed", label: "Homepage & category feed", hint: "Between articles on the homepage and category pages" },
  { value: "article", label: "In article", hint: "Between paragraphs, on every screen size" },
  { value: "sidebar", label: "Article sidebar", hint: "Top of the article's right column (1280px+)" },
  { value: "after_article", label: "After article", hint: "Below the article text (below 1440px)" },
]

export const ALL_PROMO_SPOTS: PromoSpot[] = PROMO_SPOTS.map((s) => s.value)

export const PROMO_DEVICES: [PromoBannerDevice, string][] = [
  ["all", "All devices"],
  ["desktop", "Desktop & tablet only"],
  ["mobile", "Phones only"],
]

/** Where a banner was shown — recorded with impressions and clicks. */
export type PromoPlacement =
  | "rail"
  | "feed"
  | "article"
  | "sidebar"
  | "prestitial"
  | "interstitial"
  | "special_boost"

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
  | "formats"
  | "show_on_home"
  | "category_scope"
  | "category_ids"
  | "article_scope"
  | "device"
  | "placements"
  | "repeat_in_spots"
  | "priority"
  | "weight"
>

/** Where a banner is being rendered. */
export type PromoPage =
  | { type: "home" }
  | { type: "category"; categoryId: string }
  | { type: "article"; categoryId: string }

function targetsCategory(banner: PublicPromoBanner, categoryId: string) {
  if (banner.category_scope === "all") return true
  if (banner.category_scope === "selected") return banner.category_ids.includes(categoryId)
  return false
}

export function bannerTargetsPage(banner: PublicPromoBanner, page: PromoPage): boolean {
  if (page.type === "home") return banner.show_on_home
  if (page.type === "category") return targetsCategory(banner, page.categoryId)
  if (banner.article_scope === "all") return true
  if (banner.article_scope === "categories") return targetsCategory(banner, page.categoryId)
  return false
}

/**
 * Rotation for overlapping campaigns: higher priority always comes first; banners that share a
 * priority are shuffled by weight (a weight-2 banner leads about twice as often as weight 1).
 * Uses a weighted random order (Efraimidis–Spirakis), so over many page renders each banner's
 * share of the top slots matches its weight.
 */
export function rotateByPriority<T extends Pick<PublicPromoBanner, "priority" | "weight">>(
  banners: T[],
  random: () => number = Math.random
): T[] {
  return banners
    .map((banner) => ({ banner, key: random() ** (1 / Math.max(1, banner.weight)) }))
    .sort((a, b) => b.banner.priority - a.banner.priority || b.key - a.key)
    .map(({ banner }) => banner)
}

/** One banner from the highest-priority group, chosen at random by weight. */
export function pickByPriority<T extends Pick<PublicPromoBanner, "priority" | "weight">>(
  banners: T[],
  random: () => number = Math.random
): T | null {
  return rotateByPriority(banners, random)[0] ?? null
}

/** Matches the site's mobile breakpoint (Tailwind `md`). */
export const MOBILE_MEDIA_QUERY = "(max-width: 767px)"

export function bannerShowsOnDevice(banner: Pick<PublicPromoBanner, "device">, isMobile: boolean) {
  return banner.device === "all" || banner.device === (isMobile ? "mobile" : "desktop")
}

/** Formats a banner runs as (falls back to the single legacy `format`). */
export function bannerFormats(banner: Pick<PromoBanner, "format"> & { formats?: PromoBannerFormat[] | null }) {
  return banner.formats?.length ? banner.formats : [banner.format]
}

export function hasFormat(
  banner: Pick<PromoBanner, "format"> & { formats?: PromoBannerFormat[] | null },
  format: PromoBannerFormat
) {
  return bannerFormats(banner).includes(format)
}

export function formatLabels(banner: Pick<PromoBanner, "format"> & { formats?: PromoBannerFormat[] | null }) {
  return bannerFormats(banner)
    .map((f) => PROMO_FORMAT_LABELS[f])
    .join(" + ")
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
