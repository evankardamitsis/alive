import type { PublicPromoBanner } from "@/lib/promo-banners"
import type { PromoSpot } from "@/types"

// Decides which standard banner fills each slot on a page.
//
// Rules: slots are filled in order of value; each takes the highest-ranked banner (the list is
// already sorted by priority and weight) that is allowed in that spot, suits the screen, and is
// not already showing on the same screen. Each slot is planned separately for three screen
// ranges — phone (<768px), mid (768–1439px) and wide (1440px+) — and CSS shows the right one, so
// "same screen" is tracked per screen-size tier.
// A banner with "show in every chosen spot" (repeat_in_spots) may also fill a slot it's already
// showing elsewhere on the page, once per kind of spot (the left and right rails count
// separately) — but only when no banner that isn't on the page yet can take the slot, so other
// campaigns always come first.

/** phone <768px · tablet 768–1279px · laptop 1280–1439px · wide 1440px+ */
type Tier = "phone" | "tablet" | "laptop" | "wide"

/** The screen ranges a slot is rendered for. */
export type Range = "phone" | "mid" | "wide"
const RANGE_TIERS: Record<Range, Tier[]> = { phone: ["phone"], mid: ["tablet", "laptop"], wide: ["wide"] }
const RANGE_DEVICE: Record<Range, "mobile" | "desktop"> = { phone: "mobile", mid: "desktop", wide: "desktop" }

const SPOT_TIERS: Record<PromoSpot, Tier[]> = {
  feed: ["phone", "tablet", "laptop", "wide"],
  after_article: ["phone", "tablet", "laptop"], // the side rails take over below the article at 1440px+
  article: ["phone", "tablet", "laptop", "wide"],
  sidebar: ["laptop", "wide"], // the article sidebar shows from 1280px
  rail: ["wide"],
}

const ALL_SPOTS = Object.keys(SPOT_TIERS) as PromoSpot[]

/** The banner for each screen range (null: nothing there). */
export type SlotPick = Record<Range, PublicPromoBanner | null>

/** Most banners per side rail (more only appear on tall pages). */
const RAIL_SLOTS_PER_SIDE = 3

type Slot = { spot: PromoSpot; /** what "once per kind of spot" means for repeating banners */ kind: string }

function planSlots(banners: PublicPromoBanner[], slots: Slot[]): SlotPick[] {
  const used: Record<Tier, Set<string>> = { phone: new Set(), tablet: new Set(), laptop: new Set(), wide: new Set() }
  // Repeating banners: which kinds of spot each has already filled, per screen range.
  const repeated: Record<Range, Set<string>> = { phone: new Set(), mid: new Set(), wide: new Set() }

  const pick = (slot: Slot, range: Range) => {
    const tiers = RANGE_TIERS[range].filter((t) => SPOT_TIERS[slot.spot].includes(t))
    if (tiers.length === 0) return null
    const device = RANGE_DEVICE[range]
    const fits = (b: PublicPromoBanner) =>
      (b.placements ?? ALL_SPOTS).includes(slot.spot) && b.device !== (device === "mobile" ? "desktop" : "mobile")
    const banner =
      banners.find((b) => fits(b) && tiers.every((t) => !used[t].has(b.id))) ??
      banners.find((b) => fits(b) && b.repeat_in_spots && !repeated[range].has(`${slot.kind}:${b.id}`)) ??
      null
    if (banner) {
      tiers.forEach((t) => used[t].add(banner.id))
      repeated[range].add(`${slot.kind}:${banner.id}`)
    }
    return banner
  }

  return slots.map((slot) => ({ phone: pick(slot, "phone"), mid: pick(slot, "mid"), wide: pick(slot, "wide") }))
}

const many = (n: number, spot: PromoSpot): Slot[] => Array.from({ length: n }, () => ({ spot, kind: spot }))

// Rails alternate sides by rank (left gets the 1st, 3rd, 5th slot; right the 2nd, 4th, 6th);
// for repeating banners the two sides are different kinds of spot.
const RAIL_SLOTS: Slot[] = Array.from({ length: RAIL_SLOTS_PER_SIDE * 2 }, (_, i) => ({
  spot: "rail",
  kind: i % 2 === 0 ? "rail-left" : "rail-right",
}))

function railsFrom(picks: SlotPick[]) {
  const side = (parity: number) =>
    picks.filter((_, i) => i % 2 === parity).flatMap((p) => (p.wide ? [p.wide] : []))
  return { left: side(0), right: side(1) }
}

/**
 * Homepage and category pages. Order of value on wide screens: the top of each side rail, then
 * the feed slots in page order, then the extra banners stacked lower down the rails.
 */
export function planListingPage(banners: PublicPromoBanner[], feedSlots = 12) {
  const railTops = RAIL_SLOTS.slice(0, 2)
  const railStack = RAIL_SLOTS.slice(2)
  const picks = planSlots(banners, [...railTops, ...many(feedSlots, "feed"), ...railStack])
  const feed = picks.slice(2, 2 + feedSlots)
  const rails = railsFrom([...picks.slice(0, 2), ...picks.slice(2 + feedSlots)])
  return { ...rails, feed }
}

/** Article pages: in-article slots first, then sidebar, after-article and the side rails. */
export function planArticlePage(banners: PublicPromoBanner[], inArticleSlots: number) {
  const picks = planSlots(banners, [
    ...many(inArticleSlots, "article"),
    { spot: "sidebar", kind: "sidebar" },
    { spot: "after_article", kind: "after_article" },
    ...RAIL_SLOTS,
  ])
  return {
    inArticle: picks.slice(0, inArticleSlots),
    sidebar: picks[inArticleSlots],
    afterArticle: picks[inArticleSlots + 1],
    ...railsFrom(picks.slice(inArticleSlots + 2)),
  }
}

/**
 * Group a slot's picks by banner, with the CSS classes that show each one only in its screen
 * ranges (phone <768px, mid 768–1439px, wide 1440px+).
 */
export function slotVariants(pick: SlotPick | undefined): { banner: PublicPromoBanner; className: string }[] {
  if (!pick) return []
  const byBanner = new Map<string, { banner: PublicPromoBanner; ranges: Set<Range> }>()
  for (const range of ["phone", "mid", "wide"] as const) {
    const banner = pick[range]
    if (!banner) continue
    const entry = byBanner.get(banner.id) ?? { banner, ranges: new Set<Range>() }
    entry.ranges.add(range)
    byBanner.set(banner.id, entry)
  }
  return [...byBanner.values()].map(({ banner, ranges }) => ({
    banner,
    className: [
      !ranges.has("phone") && "max-md:hidden",
      !ranges.has("mid") && "md:max-[1439px]:hidden",
      !ranges.has("wide") && "min-[1440px]:hidden",
    ]
      .filter(Boolean)
      .join(" "),
  }))
}
