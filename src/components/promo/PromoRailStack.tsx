"use client"

import { useEffect, useRef, useState } from "react"
import type { PublicPromoBanner } from "@/lib/promo-banners"
import { PromoLabel, PromoLink, PromoPicture } from "./PromoVisual"

/** Page height each stacked rail banner gets: about a screen of scrolling per banner. */
const SEGMENT_MIN_HEIGHT = 900

function RailBanner({ banner }: { banner: PublicPromoBanner }) {
  return (
    <div className="sticky top-20 pt-6">
      <PromoLabel className="mb-2" />
      <PromoLink banner={banner} placement="rail" className="block overflow-hidden rounded-lg">
        <PromoPicture
          banner={banner}
          sizes="(min-width: 1800px) 300px, 160px"
          className="block h-auto max-h-[calc(100vh-7rem)] w-full object-contain"
        />
      </PromoLink>
    </div>
  )
}

/**
 * One side rail. The rail is as tall as the page content; it is split into equal sections,
 * one per banner that fits, and each banner stays sticky within its own section — so while
 * scrolling, the first banner hands over to the next. Short pages show only the first.
 */
export function PromoRailStack({ banners }: { banners: PublicPromoBanner[] }) {
  const ref = useRef<HTMLDivElement>(null)
  // Server render shows one banner; more appear once the rail's height is known.
  const [count, setCount] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el || banners.length < 2) return
    const update = () => {
      const fit = Math.floor(el.getBoundingClientRect().height / SEGMENT_MIN_HEIGHT)
      setCount(Math.min(banners.length, Math.max(1, fit)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [banners.length])

  return (
    <div ref={ref} className="flex h-full flex-col">
      {banners.slice(0, count).map((banner) => (
        <div key={banner.id} className="min-h-0 flex-1">
          <RailBanner banner={banner} />
        </div>
      ))}
    </div>
  )
}
