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
//
// Each banner shows at most once on a page (for what is visible at a given screen width): every
// placement takes its own position in the rotated list, and runs out rather than repeating.
// Feed slots and rails are never visible together, so on homepage and category pages both start
// from the top of the list; article pages hand positions out in order (see the article page).

/**
 * Standard banners for the given page in slot order: highest priority first, banners of equal
 * priority shuffled by weight. The order is drawn each time the page renders; pages are cached
 * for 60s, so it rotates about once a minute across the site.
 */
export function inlineBannersFor(banners: PublicPromoBanner[], page: PromoPage) {
  return rotateByPriority(banners.filter((b) => b.format === "standard" && bannerTargetsPage(b, page)))
}

/** The banner for a slot, or null once every banner has been used (banners never repeat). */
export function bannerForSlot(banners: PublicPromoBanner[], slot: number) {
  return banners[slot] ?? null
}

const forDesktop = (banners: PublicPromoBanner[]) => banners.filter((b) => b.device !== "mobile")
const forMobile = (banners: PublicPromoBanner[]) => banners.filter((b) => b.device !== "desktop")

/** Wraps page content with desktop side rails when there are banners to show. */
export function PromoRails({
  banners,
  skip = 0,
  children,
}: {
  banners: PublicPromoBanner[]
  /** Desktop banners already used by other placements visible alongside the rails */
  skip?: number
  children: React.ReactNode
}) {
  // Rails only exist on wide screens, so phone-only banners never go here.
  const railBanners = forDesktop(banners).slice(skip)
  if (railBanners.length === 0) return <>{children}</>

  // Banners alternate sides by priority (left: 1st, 3rd, 5th; right: 2nd, 4th, 6th) and stack
  // down each rail on tall pages. No banner appears twice: with a single banner, only the left
  // rail shows it.
  const left = railBanners.filter((_, i) => i % 2 === 0).slice(0, MAX_PER_RAIL)
  const right = railBanners.filter((_, i) => i % 2 === 1).slice(0, MAX_PER_RAIL)

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
  desktopSlot = slot,
  placement = "feed",
  className = "",
}: {
  banners: PublicPromoBanner[]
  /** Position in the phone list (and the desktop list, unless desktopSlot is given) */
  slot: number
  desktopSlot?: number
  placement?: "feed" | "article"
  className?: string
}) {
  const mobile = bannerForSlot(forMobile(banners), slot)
  const desktop = bannerForSlot(forDesktop(banners), desktopSlot)
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
 * `index` is its position in the desktop list, after the in-article banners.
 */
export function PromoSidebar({
  banners,
  index,
  className = "",
}: {
  banners: PublicPromoBanner[]
  index: number
  className?: string
}) {
  const banner = bannerForSlot(forDesktop(banners), index)
  if (!banner) return null
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
