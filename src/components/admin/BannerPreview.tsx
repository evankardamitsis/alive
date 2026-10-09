"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { SpecialBoost, Takeover } from "@/components/promo/PromoOverlays"
import { PROMO_SPOTS, type PublicPromoBanner } from "@/lib/promo-banners"
import type { PromoBannerFormat } from "@/types"

// Admin-only preview of a banner as the site shows it, before it goes live.
// Full-screen formats open the real overlay; standard banners show each placement at real size.

const PHONE_CONTENT_WIDTH = 358 // 390px phone minus the feed's 16px side padding

function Frame({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
          {title}
        </p>
        <p className="text-[11px]" style={{ color: "var(--fg-3)" }}>
          {note}
        </p>
      </div>
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.2em]"
          style={{ color: "var(--fg-3)" }}
        >
          Διαφήμιση
        </p>
        {children}
      </div>
    </div>
  )
}

function StandardPreview({ banner, onClose }: { banner: PublicPromoBanner; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const keyW = banner.image_width ?? 300
  const mobileUrl = banner.mobile_image_url ?? banner.image_url
  const mobileW = (banner.mobile_image_url ? banner.mobile_image_width : banner.image_width) ?? 300
  const showsDesktop = banner.device !== "mobile"
  const showsMobile = banner.device !== "desktop"
  // Only the spots this banner may use.
  const inRails = banner.placements.includes("rail")
  const inSidebar = banner.placements.includes("sidebar")
  const inlineSpots = PROMO_SPOTS.filter(
    (s) => s.value === "feed" || s.value === "article" || s.value === "after_article",
  )
    .filter((s) => banner.placements.includes(s.value))
    .map((s) => s.label)
  const inlineNote = inlineSpots.join(" · ")

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Banner preview"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-5xl rounded-xl p-5" style={{ backgroundColor: "var(--bg-2)" }}>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Preview: standard banner
          </p>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-md p-1.5"
            style={{ color: "var(--fg-2)" }}
          >
            <X size={16} />
          </button>
        </div>
        {/* eslint-disable @next/next/no-img-element -- previews show the stored file at exact pixel sizes */}
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          {showsDesktop && (inRails || inSidebar) && (
            <div className="flex gap-4">
              {inSidebar && (
                <Frame title="Article sidebar" note="1280px and wider">
                  <img
                    src={banner.image_url}
                    alt=""
                    className="block h-auto max-h-[600px] w-[300px] rounded-lg object-contain"
                  />
                </Frame>
              )}
              {inRails && (
                <Frame title="Side rail" note="1800px and wider">
                  <img src={banner.image_url} alt="" className="block h-auto w-[300px] rounded-lg" />
                </Frame>
              )}
              {inRails && (
                <Frame title="Side rail" note="1440–1799px">
                  <img src={banner.image_url} alt="" className="block h-auto w-[160px] rounded-lg" />
                </Frame>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-start gap-6">
            {showsDesktop && inlineSpots.length > 0 && (
              <Frame title="In the page" note={`Tablets and laptops · ${inlineNote}`}>
                <img
                  src={banner.image_url}
                  alt=""
                  className="mx-auto block h-auto max-h-[600px] max-w-full rounded-xl object-contain"
                  style={{ width: keyW }}
                />
              </Frame>
            )}
            {showsMobile && inlineSpots.length > 0 && (
              <Frame title="In the page" note={`Phone, 390px · ${inlineNote}`}>
                <div style={{ width: PHONE_CONTENT_WIDTH }}>
                  <img
                    src={mobileUrl}
                    alt=""
                    className="mx-auto block h-auto max-h-[600px] max-w-full rounded-xl object-contain"
                    style={{ width: mobileW }}
                  />
                </div>
              </Frame>
            )}
          </div>
        </div>
        {/* eslint-enable @next/next/no-img-element */}
        {banner.device !== "all" && (
          <p className="mt-4 text-xs" style={{ color: "var(--fg-3)" }}>
            Device targeting: {banner.device === "mobile" ? "phones only" : "desktop & tablet only"}.
          </p>
        )}
      </div>
    </div>
  )
}

/** Preview one of the banner's formats (the first one if none is given). */
export function BannerPreview({
  banner,
  format = banner.formats?.[0] ?? banner.format,
  onClose,
}: {
  banner: PublicPromoBanner
  format?: PromoBannerFormat
  onClose: () => void
}) {
  if (format === "standard") return <StandardPreview banner={banner} onClose={onClose} />
  return (
    // Keep the admin on this page: the visual's link is not followed in a preview.
    <div
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("a")) e.preventDefault()
      }}
    >
      {format === "special_boost" ? (
        <SpecialBoost banner={banner} onClose={onClose} />
      ) : (
        <Takeover banner={banner} format={format} onClose={onClose} />
      )}
    </div>
  )
}
