import { getImageProps } from "next/image"
import { isGifUrl, MOBILE_MEDIA_QUERY, type PublicPromoBanner } from "@/lib/promo-banners"

export { PromoLink } from "./PromoLink"

/** Below this width the mobile visual (if any) is used. Matches Tailwind's `md`. */
const MOBILE_MEDIA = MOBILE_MEDIA_QUERY

// Fallback intrinsic size for banners saved without dimensions; the real ratio wins once loaded.
const FALLBACK = { width: 1200, height: 628 }

function imageProps(
  src: string,
  width: number | null,
  height: number | null,
  sizes: string,
  alt: string,
  eager?: boolean
) {
  return getImageProps({
    src,
    alt,
    width: width ?? FALLBACK.width,
    height: height ?? FALLBACK.height,
    sizes,
    loading: eager ? "eager" : "lazy",
    // Animated GIFs are served as-is (the optimiser would only return the original anyway).
    unoptimized: isGifUrl(src),
  }).props
}

/**
 * Art-directed banner visual: the mobile visual on small screens when provided,
 * otherwise the key visual everywhere. Served through next/image (resized + WebP),
 * except GIFs which keep their animation.
 */
export function PromoPicture({
  banner,
  sizes,
  mobileSizes = "100vw",
  className,
  style,
  eager,
}: {
  banner: PublicPromoBanner
  sizes: string
  mobileSizes?: string
  className?: string
  style?: React.CSSProperties
  /** Load immediately (full-screen formats) instead of lazily */
  eager?: boolean
}) {
  const alt = banner.alt_text ?? "Διαφήμιση"
  const { srcSet: keySrcSet, ...keyRest } = imageProps(
    banner.image_url,
    banner.image_width,
    banner.image_height,
    sizes,
    alt,
    eager
  )
  const mobile = banner.mobile_image_url
    ? imageProps(banner.mobile_image_url, banner.mobile_image_width, banner.mobile_image_height, mobileSizes, alt, eager)
    : null

  const mobileSize = banner.mobile_image_url
    ? {
        width: banner.mobile_image_width ?? FALLBACK.width,
        height: banner.mobile_image_height ?? FALLBACK.height,
      }
    : { width: banner.image_width ?? FALLBACK.width, height: banner.image_height ?? FALLBACK.height }

  return (
    <picture>
      {mobile && (
        <source
          media={MOBILE_MEDIA}
          srcSet={mobile.srcSet ?? mobile.src}
          sizes={mobile.sizes}
          width={mobile.width}
          height={mobile.height}
        />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from keyRest */}
      <img
        {...keyRest}
        srcSet={keySrcSet}
        decoding="async"
        className={className}
        // Natural display widths as CSS vars so callers can size the visual to its real width
        // (srcset candidates are wider than small banners and would otherwise shrink them).
        style={
          {
            ...keyRest.style,
            "--promo-w": `${banner.image_width ?? FALLBACK.width}px`,
            "--promo-mw": `${mobileSize.width}px`,
            // Aspect ratios, so full-screen formats can cap their width by the available height
            // (otherwise a height-capped visual keeps its full width and gets letterboxed).
            "--promo-ar": `${banner.image_width ?? FALLBACK.width} / ${banner.image_height ?? FALLBACK.height}`,
            "--promo-mar": `${mobileSize.width} / ${mobileSize.height}`,
            ...style,
          } as React.CSSProperties
        }
      />
    </picture>
  )
}

/**
 * The banner as its small visual: in-page slots (feed, in article, sidebar, after article) use
 * the small visual (e.g. 300×250) on every screen; only the side rails use the tall key visual.
 * Falls back to the key visual when no small visual is set.
 */
export function smallVisual(banner: PublicPromoBanner): PublicPromoBanner {
  if (!banner.mobile_image_url) return banner
  return {
    ...banner,
    image_url: banner.mobile_image_url,
    image_width: banner.mobile_image_width,
    image_height: banner.mobile_image_height,
    mobile_image_url: null,
    mobile_image_width: null,
    mobile_image_height: null,
  }
}

/** Small "ΔΙΑΦΗΜΙΣΗ" label shown above inline placements, as Greek publishers do. */
export function PromoLabel({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-center text-[10px] font-medium uppercase tracking-[0.2em] ${className}`}
      style={{ color: "var(--fg-3)" }}
    >
      Διαφήμιση
    </p>
  )
}
