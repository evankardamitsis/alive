import { bannerTargetsPage, hasFormat, rotateByPriority, type PromoPage, type PublicPromoBanner } from "@/lib/promo-banners"
import { slotVariants, type RowPick, type SlotPick } from "@/lib/promo-plan"
import { PromoLink, PromoPicture, smallVisual } from "./PromoVisual"
import { PromoRailStack } from "./PromoRailStack"

// Layout:
//   ≥1440px  → sticky "skin" rails left & right of the content (160px, 300px from 1800px),
//              stacking up to 3 banners per side on tall pages
//   all widths → banners between feed items and between article paragraphs
// Breakpoints follow what Greek publishers do (skins only on wide screens).
// Which banner goes in which slot is decided by lib/promo-plan (placements, devices, and each
// banner at most once per screen). The server can't know the visitor's screen, so a slot renders
// a pick per screen range (phone, 768–1439px, 1440px+) and CSS shows the right one.

/**
 * Standard banners for the given page in rank order: highest priority first, banners of equal
 * priority shuffled by weight. The order is drawn each time the page renders; pages are cached
 * for 60s, so it rotates about once a minute across the site.
 */
export function inlineBannersFor(banners: PublicPromoBanner[], page: PromoPage) {
  return rotateByPriority(banners.filter((b) => hasFormat(b, "standard") && bannerTargetsPage(b, page)))
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
      <PromoLink banner={banner} placement={placement} className="mx-auto block w-fit max-w-full overflow-hidden rounded-xl">
        <PromoPicture
          banner={smallVisual(banner)}
          sizes="(max-width: 767px) 100vw, 340px"
          className="mx-auto block h-auto max-h-[600px] w-[var(--promo-w)] max-w-full object-contain"
        />
      </PromoLink>
    </aside>
  )
}

/**
 * Banner between content: the homepage/category feed, after an article ("feed"), or between an
 * article's paragraphs ("article"). Each screen range shows its own pick.
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
  return (
    <>
      {slotVariants(pick).map(({ banner, className: screens }) => (
        <InFeedBanner key={banner.id} banner={banner} placement={placement} className={`${screens} ${className}`} />
      ))}
    </>
  )
}

// Row positions: the 2nd shows from 768px, the 3rd from 1280px (the planner leaves them empty on
// smaller screens, and this hides them on tablets, which share a pick with laptops).
const ROW_POSITION_CLASS = ["", "", "max-[1279px]:hidden"]

/**
 * A row of ads between sections of the homepage and category pages: a tinted panel holding up
 * to three ads of the same 300×250 size side by side. Hidden on screens where the row is empty.
 */
export function PromoRow({ row, className = "" }: { row: RowPick | undefined; className?: string }) {
  if (!row) return null
  const has = (range: "phone" | "mid" | "wide") => row.some((p) => p[range])
  if (!has("phone") && !has("mid") && !has("wide")) return null
  const hide = [!has("phone") && "max-md:hidden", !has("mid") && "md:max-[1439px]:hidden", !has("wide") && "min-[1440px]:hidden"]
    .filter(Boolean)
    .join(" ")
  return (
    <div className={`${hide} ${className}`}>
      <aside
        aria-label="Διαφήμιση"
        className="flex flex-wrap justify-center gap-4 rounded-2xl p-4 md:gap-6 md:p-6"
        style={{ backgroundColor: "var(--bg-2)" }}
      >
        {row.flatMap((pick, i) =>
          slotVariants(pick).map(({ banner, className: screens }) => (
            <PromoLink
              key={`${i}:${banner.id}`}
              banner={banner}
              placement="feed"
              className={`${screens} ${ROW_POSITION_CLASS[i]} block aspect-[6/5] w-[300px] max-w-full overflow-hidden rounded-xl`}
            >
              <PromoPicture
                banner={smallVisual(banner)}
                sizes="300px"
                className="block h-full w-full object-contain"
              />
            </PromoLink>
          )),
        )}
      </aside>
    </div>
  )
}

/** Banner at the top of an article's right-hand sidebar (the sidebar shows from 1280px). */
export function PromoSidebar({ pick }: { pick: SlotPick | undefined }) {
  return (
    <>
      {slotVariants(pick).map(({ banner, className }) => (
        <SidebarBanner key={banner.id} banner={banner} className={className} />
      ))}
    </>
  )
}

function SidebarBanner({ banner, className }: { banner: PublicPromoBanner; className: string }) {
  return (
    <aside aria-label="Διαφήμιση" data-promo-slot="sidebar" className={className}>
      <PromoLink banner={banner} placement="sidebar" className="mx-auto block w-fit max-w-full overflow-hidden rounded-xl">
        <PromoPicture
          banner={smallVisual(banner)}
          sizes="300px"
          className="mx-auto block h-auto max-h-[600px] w-[var(--promo-w)] max-w-full object-contain"
        />
      </PromoLink>
    </aside>
  )
}
