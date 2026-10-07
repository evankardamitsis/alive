"use client"

import { useEffect, useRef } from "react"
import { isExternalUrl, type PromoPlacement, type PublicPromoBanner } from "@/lib/promo-banners"
import { track } from "@/lib/track"

// Impressions count once per banner per page view: the same banner in both side rails,
// or twice in one feed, is one impression. Clicks always count.
let impressionPath = ""
const seenOnPage = new Set<string>()

function recordImpression(banner: PublicPromoBanner, placement: PromoPlacement) {
  if (impressionPath !== window.location.pathname) {
    impressionPath = window.location.pathname
    seenOnPage.clear()
  }
  if (seenOnPage.has(banner.id)) return
  seenOnPage.add(banner.id)
  track({ type: "impression", bannerId: banner.id, placement })
}

/**
 * Clickable wrapper that sends the visitor to the banner's destination, and records an
 * impression once at least half of it is on screen (hidden copies, e.g. the in-feed banner
 * on wide screens, never count; full-screen formats count when they open) plus a click
 * when it is clicked.
 */
export function PromoLink({
  banner,
  placement,
  className,
  children,
  onClick,
}: {
  banner: PublicPromoBanner
  placement: PromoPlacement
  className?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const external = isExternalUrl(banner.destination_url)

  useEffect(() => {
    // Full-screen formats cover the page, so opening one is an impression.
    if (placement !== "rail" && placement !== "feed") {
      recordImpression(banner, placement)
      return
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          recordImpression(banner, placement)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [banner, placement])

  return (
    <a
      ref={ref}
      href={banner.destination_url}
      target={external ? "_blank" : undefined}
      rel={external ? "sponsored noopener" : "sponsored"}
      className={className}
      onClick={() => {
        track({ type: "click", bannerId: banner.id, placement })
        onClick?.()
      }}
      data-promo-id={banner.id}
    >
      {children}
    </a>
  )
}
