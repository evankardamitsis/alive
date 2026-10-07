import { bannerTargetsPage, type PromoPage, type PublicPromoBanner } from "@/lib/promo-banners"
import { PromoLabel, PromoLink, PromoPicture } from "./PromoVisual"

// Layout:
//   ≥1440px  → sticky "skin" rails left & right of the content (160px, 300px from 1800px)
//   <1440px  → banners sit inside the feed instead (mobile, tablets, small laptops)
// Breakpoints follow what Greek publishers do (skins only on wide screens, MPUs in-feed on mobile).

/** Standard banners that should appear on the given page, highest priority first. */
export function inlineBannersFor(banners: PublicPromoBanner[], page: PromoPage) {
  return banners.filter((b) => b.format === "standard" && bannerTargetsPage(b, page))
}

/**
 * Rotate through banners so consecutive feed slots don't repeat the same one.
 * Each banner is used at most twice per page so a single campaign doesn't flood the feed.
 */
export function bannerForSlot(banners: PublicPromoBanner[], slot: number) {
  if (banners.length === 0 || slot >= banners.length * 2) return null
  return banners[slot % banners.length]
}

function RailBanner({ banner }: { banner: PublicPromoBanner }) {
  return (
    <div className="sticky top-20 pt-6">
      <PromoLabel className="mb-2" />
      <PromoLink banner={banner} className="block overflow-hidden rounded-lg">
        <PromoPicture
          banner={banner}
          sizes="(min-width: 1800px) 300px, 160px"
          className="block h-auto max-h-[calc(100vh-7rem)] w-full object-contain"
        />
      </PromoLink>
    </div>
  )
}

/** Wraps page content with desktop side rails when there are banners to show. */
export function PromoRails({
  banners,
  children,
}: {
  banners: PublicPromoBanner[]
  children: React.ReactNode
}) {
  if (banners.length === 0) return <>{children}</>

  const left = banners[0]
  const right = banners[1] ?? banners[0]

  return (
    <div className="mx-auto max-w-[2280px] min-[1440px]:grid min-[1440px]:grid-cols-[160px_minmax(0,1fr)_160px] min-[1440px]:gap-4 min-[1440px]:px-4 min-[1800px]:grid-cols-[300px_minmax(0,1fr)_300px] min-[1800px]:gap-6 min-[1800px]:px-6">
      <aside aria-label="Διαφήμιση" className="hidden min-[1440px]:block">
        <RailBanner banner={left} />
      </aside>
      <div className="min-w-0">{children}</div>
      <aside aria-label="Διαφήμιση" className="hidden min-[1440px]:block">
        <RailBanner banner={right} />
      </aside>
    </div>
  )
}

/** In-feed banner for mobile / smaller screens. Hidden where the side rails take over. */
export function PromoInFeed({
  banner,
  className = "",
}: {
  banner: PublicPromoBanner | null
  className?: string
}) {
  if (!banner) return null
  return (
    <aside aria-label="Διαφήμιση" className={`min-[1440px]:hidden ${className}`}>
      <PromoLabel className="mb-2" />
      <PromoLink banner={banner} className="mx-auto block w-fit max-w-full overflow-hidden rounded-xl">
        <PromoPicture
          banner={banner}
          sizes="(max-width: 767px) 100vw, 970px"
          className="mx-auto block h-auto max-h-[600px] w-[var(--promo-mw)] max-w-full object-contain md:w-[var(--promo-w)]"
        />
      </PromoLink>
    </aside>
  )
}
