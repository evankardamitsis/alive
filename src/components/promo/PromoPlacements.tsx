import { bannerTargetsPage, rotateByPriority, type PromoPage, type PublicPromoBanner } from "@/lib/promo-banners"
import type { SlotPick } from "@/lib/promo-plan"
import { PromoLabel, PromoLink, PromoPicture } from "./PromoVisual"
import { PromoRailStack } from "./PromoRailStack"

// Layout:
//   ≥1440px  → sticky "skin" rails left & right of the content (160px, 300px from 1800px),
//              stacking up to 3 banners per side on tall pages
//   <1440px  → banners sit inside the feed instead (mobile, tablets, small laptops)
// Breakpoints follow what Greek publishers do (skins only on wide screens, MPUs in-feed on mobile).
// Which banner goes in which slot is decided by lib/promo-plan (placements, devices, and each
// banner at most once per screen). Device targeting: "mobile" = below 768px, "desktop" = 768px
// and up; the server can't know the visitor's screen, so a slot renders a phone pick and a
// desktop pick and CSS shows one.

/**
 * Standard banners for the given page in rank order: highest priority first, banners of equal
 * priority shuffled by weight. The order is drawn each time the page renders; pages are cached
 * for 60s, so it rotates about once a minute across the site.
 */
export function inlineBannersFor(banners: PublicPromoBanner[], page: PromoPage) {
  return rotateByPriority(banners.filter((b) => b.format === "standard" && bannerTargetsPage(b, page)))
}

/** Wraps page content with desktop side rails when there are banners to show. */
export function PromoRails({
  left,
  right,
  children,
}: {
  left: PublicPromoBanner[]
  right: PublicPromoBanner[]
  children: React.ReactNode
}) {
  if (left.length === 0 && right.length === 0) return <>{children}</>
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
 * Banner between content. "feed" slots (homepage/category feed, after an article) hide where the
 * side rails take over (1440px+); "article" slots sit between paragraphs and show on every screen.
 */
export function PromoInFeed({
  pick,
  placement = "feed",
  className = "",
}: {
  pick: SlotPick | undefined
  placement?: "feed" | "article"
  className?: string
}) {
  if (!pick) return null
  const { phone, desktop } = pick
  const wide = placement === "feed" ? "min-[1440px]:hidden" : ""

  if (phone && desktop && phone.id === desktop.id) {
    return <InFeedBanner banner={phone} placement={placement} className={`${wide} ${className}`} />
  }
  return (
    <>
      {phone && <InFeedBanner banner={phone} placement={placement} className={`md:hidden ${className}`} />}
      {desktop && (
        <InFeedBanner banner={desktop} placement={placement} className={`max-md:hidden ${wide} ${className}`} />
      )}
    </>
  )
}

/** Banner at the top of an article's right-hand sidebar (the sidebar shows from 1280px). */
export function PromoSidebar({ banner, className = "" }: { banner: PublicPromoBanner | null; className?: string }) {
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
