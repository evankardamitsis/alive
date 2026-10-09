import type { PublicPromoBanner } from "@/lib/promo-banners"
import type { PromoSpot } from "@/types"

// Decides which standard banner fills each slot on a page.
//
// Rules: slots are filled in order of value; each takes the highest-ranked banner (the list is
// already sorted by priority and weight) that is allowed in that spot, suits the screen, and is
// not already showing on the same screen. The page renders separate phone and desktop picks per
// slot and CSS shows the right one, so "same screen" is tracked per screen-size tier.

/** phone <768px · tablet 768–1279px · laptop 1280–1439px · wide 1440px+ */
type Tier = "phone" | "tablet" | "laptop" | "wide"

const SPOT_TIERS: Record<PromoSpot, Tier[]> = {
  feed: ["phone", "tablet", "laptop"], // rails take over at 1440px
  after_article: ["phone", "tablet", "laptop"],
  article: ["phone", "tablet", "laptop", "wide"],
  sidebar: ["laptop", "wide"], // the article sidebar shows from 1280px
  rail: ["wide"],
}

export type SlotPick = { phone: PublicPromoBanner | null; desktop: PublicPromoBanner | null }

const ALL_SPOTS = Object.keys(SPOT_TIERS) as PromoSpot[]

/** Most banners per side rail (more only appear on tall pages). */
const RAIL_SLOTS_PER_SIDE = 3

function planSlots(banners: PublicPromoBanner[], spots: PromoSpot[]): SlotPick[] {
  const used: Record<Tier, Set<string>> = { phone: new Set(), tablet: new Set(), laptop: new Set(), wide: new Set() }

  const pick = (spot: PromoSpot, tiers: Tier[], device: "mobile" | "desktop") => {
    if (tiers.length === 0) return null
    const banner =
      banners.find(
        (b) =>
          (b.placements ?? ALL_SPOTS).includes(spot) &&
          b.device !== (device === "mobile" ? "desktop" : "mobile") &&
          tiers.every((t) => !used[t].has(b.id))
      ) ?? null
    if (banner) tiers.forEach((t) => used[t].add(banner.id))
    return banner
  }

  return spots.map((spot) => {
    const tiers = SPOT_TIERS[spot]
    return {
      phone: pick(spot, tiers.filter((t) => t === "phone"), "mobile"),
      desktop: pick(spot, tiers.filter((t) => t !== "phone"), "desktop"),
    }
  })
}

function railsFrom(picks: SlotPick[]) {
  const rail = picks.map((p) => p.desktop).filter((b): b is PublicPromoBanner => b !== null)
  // Alternate sides by rank: left gets 1st, 3rd, 5th; right 2nd, 4th, 6th.
  return { left: rail.filter((_, i) => i % 2 === 0), right: rail.filter((_, i) => i % 2 === 1) }
}

/** Homepage and category pages: feed slots in page order, plus the side rails. */
export function planListingPage(banners: PublicPromoBanner[], feedSlots = 12) {
  const picks = planSlots(banners, [
    ...Array<PromoSpot>(feedSlots).fill("feed"),
    ...Array<PromoSpot>(RAIL_SLOTS_PER_SIDE * 2).fill("rail"),
  ])
  return { feed: picks.slice(0, feedSlots), ...railsFrom(picks.slice(feedSlots)) }
}

/** Article pages: in-article slots first, then sidebar, after-article and the side rails. */
export function planArticlePage(banners: PublicPromoBanner[], inArticleSlots: number) {
  const picks = planSlots(banners, [
    ...Array<PromoSpot>(inArticleSlots).fill("article"),
    "sidebar",
    "after_article",
    ...Array<PromoSpot>(RAIL_SLOTS_PER_SIDE * 2).fill("rail"),
  ])
  return {
    inArticle: picks.slice(0, inArticleSlots),
    sidebar: picks[inArticleSlots].desktop,
    afterArticle: picks[inArticleSlots + 1],
    ...railsFrom(picks.slice(inArticleSlots + 2)),
  }
}
