import { getImageProps } from "next/image"
import { isExternalUrl, isGifUrl, type PublicPromoBanner } from "@/lib/promo-banners"

/** Below this width the mobile visual (if any) is used. Matches Tailwind's `md`. */
const MOBILE_MEDIA = "(max-width: 767px)"

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
            "--promo-mw": `${(banner.mobile_image_url ? banner.mobile_image_width : banner.image_width) ?? FALLBACK.width}px`,
            ...style,
          } as React.CSSProperties
        }
      />
    </picture>
  )
}

/** Clickable wrapper that sends the visitor to the banner's destination. */
export function PromoLink({
  banner,
  className,
  children,
  onClick,
}: {
  banner: PublicPromoBanner
  className?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const external = isExternalUrl(banner.destination_url)
  return (
    <a
      href={banner.destination_url}
      target={external ? "_blank" : undefined}
      rel={external ? "sponsored noopener" : "sponsored"}
      className={className}
      onClick={onClick}
      data-promo-id={banner.id}
    >
      {children}
    </a>
  )
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
