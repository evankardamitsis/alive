import { bannerTargetsPage, rotateByPriority, type PromoPage, type PublicPromoBanner } from "@/lib/promo-banners"
import { PromoLabel, PromoLink, PromoPicture } from "./PromoVisual"
import { PromoRailStack } from "./PromoRailStack"

/** Most banners stacked in one side rail (more only appear on tall pages). */
const MAX_PER_RAIL = 3

// Layout:
//   ≥1440px  → sticky "skin" rails left & right of the content (160px, 300px from 1800px),
//              stacking up to 3 banners per side on tall pages
//   <1440px  → banners sit inside the feed instead (mobile, tablets, small laptops)
// Breakpoints follow what Greek publishers do (skins only on wide screens, MPUs in-feed on mobile).
// Device targeting: "mobile" = below 768px, "desktop" = 768px and up. The server can't know the
// visitor's screen, so each feed slot renders a phone pick and a desktop pick and CSS shows one.

/**
 * Standard banners for the given page in slot order: highest priority first, banners of equal
 * priority shuffled by weight. The order is drawn each time the page renders; pages are cached
 * for 60s, so it rotates about once a minute across the site.
 */
export function inlineBannersFor(banners: PublicPromoBanner[], page: PromoPage) {
  return rotateByPriority(banners.filter((b) => b.format === "standard" && bannerTargetsPage(b, page)))
}

/**
 * Rotate through banners so consecutive feed slots don't repeat the same one.
 * Each banner is used at most twice per page so a single campaign doesn't flood the feed.
 */
export function bannerForSlot(banners: PublicPromoBanner[], slot: number) {
  if (banners.length === 0 || slot >= banners.length * 2) return null
  return banners[slot % banners.length]
}

const forDesktop = (banners: PublicPromoBanner[]) => banners.filter((b) => b.device !== "mobile")
const forMobile = (banners: PublicPromoBanner[]) => banners.filter((b) => b.device !== "desktop")

/** Wraps page content with desktop side rails when there are banners to show. */
export function PromoRails({
  banners,
  children,
}: {
  banners: PublicPromoBanner[]
  children: React.ReactNode
}) {
  // Rails only exist on wide screens, so phone-only banners never go here.
  const railBanners = forDesktop(banners)
  if (railBanners.length === 0) return <>{children}</>

  // Top slots go by priority: left starts with the 1st banner, right with the 2nd. Further down
  // each rail cycles through the rest (left: 1st, 3rd, 5th… then 2nd, 4th…; right the other way
  // round), so tall pages fill both rails and the same banner never sits level on both sides.
  const evens = railBanners.filter((_, i) => i % 2 === 0)
  const odds = railBanners.filter((_, i) => i % 2 === 1)
  const left = [...evens, ...odds].slice(0, MAX_PER_RAIL)
  const right = railBanners.length > 1 ? [...odds, ...evens].slice(0, MAX_PER_RAIL) : left

  return (
    <div className="mx-auto max-w-[2280px] min-[1440px]:grid min-[1440px]:grid-cols-[160px_minmax(0,1fr)_160px] min-[1440px]:gap-4 min-[1440px]:px-4 min-[1800px]:grid-cols-[300px_minmax(0,1fr)_300px] min-[1800px]:gap-6 min-[1800px]:px-6">
      <aside aria-label="Διαφήμιση" className="hidden min-[1440px]:block">
        <PromoRailStack banners={left} />
      </aside>
      <div className="min-w-0">{children}</div>
      <aside aria-label="Διαφήμιση" className="hidden min-[1440px]:block">
        <PromoRailStack banners={right} />
      </aside>
    </div>
  )
}

function InFeedBanner({
  banner,
  placement,
  className,
}: {
  banner: PublicPromoBanner
  placement: "feed" | "article"
  className: string
}) {
  return (
    <aside aria-label="Διαφήμιση" className={className}>
      <PromoLabel className="mb-2" />
      <PromoLink banner={banner} placement={placement} className="mx-auto block w-fit max-w-full overflow-hidden rounded-xl">
        <PromoPicture
          banner={banner}
          sizes="(max-width: 767px) 100vw, 970px"
          className="mx-auto block h-auto max-h-[600px] w-[var(--promo-mw)] max-w-full object-contain md:w-[var(--promo-w)]"
        />
      </PromoLink>
    </aside>
  )
}

/**
 * Banner between content. "feed" slots are for phones, tablets and laptops and hide where the
 * side rails take over (1440px+); "article" slots sit between paragraphs and show on every screen.
 */
export function PromoInFeed({
  banners,
  slot,
  placement = "feed",
  className = "",
}: {
  banners: PublicPromoBanner[]
  slot: number
  placement?: "feed" | "article"
  className?: string
}) {
  const mobile = bannerForSlot(forMobile(banners), slot)
  const desktop = bannerForSlot(forDesktop(banners), slot)
  const wide = placement === "feed" ? "min-[1440px]:hidden" : ""

  if (mobile && desktop && mobile.id === desktop.id) {
    return <InFeedBanner banner={mobile} placement={placement} className={`${wide} ${className}`} />
  }
  return (
    <>
      {mobile && <InFeedBanner banner={mobile} placement={placement} className={`md:hidden ${className}`} />}
      {desktop && (
        <InFeedBanner banner={desktop} placement={placement} className={`max-md:hidden ${wide} ${className}`} />
      )}
    </>
  )
}

/**
 * Banner at the top of an article's right-hand sidebar (the sidebar shows from 1280px).
 * Takes the second banner in the rotation, so it differs from the first in-article banner.
 */
export function PromoSidebar({ banners, className = "" }: { banners: PublicPromoBanner[]; className?: string }) {
  const desktop = forDesktop(banners)
  if (desktop.length === 0) return null
  const banner = desktop[1 % desktop.length]
  return (
    <aside aria-label="Διαφήμιση" className={className}>
      <PromoLabel className="mb-2" />
      <PromoLink banner={banner} placement="sidebar" className="mx-auto block w-fit max-w-full overflow-hidden rounded-xl">
        <PromoPicture
          banner={banner}
          sizes="300px"
          className="mx-auto block h-auto max-h-[600px] w-[var(--promo-w)] max-w-full object-contain"
        />
      </PromoLink>
    </aside>
  )
}
