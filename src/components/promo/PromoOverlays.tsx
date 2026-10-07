"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Logo } from "@/components/Logo"
import { bannerTargetsPage, type PromoPage, type PublicPromoBanner } from "@/lib/promo-banners"
import { PromoLink, PromoPicture } from "./PromoVisual"

// Full-screen promo formats:
//   prestitial    → first page of the visit, before the visitor reads anything. Once per session.
//   interstitial  → on in-site navigation (any page view after the first). Once per session.
//   special_boost → popup with the visual on page load. Once per day per visitor.
// At most one overlay per page view.

/** Prestitials / interstitials close themselves after this many seconds. */
const AUTO_CLOSE_SECONDS = 10
const BOOST_COOLDOWN_MS = 24 * 60 * 60 * 1000
const STORAGE_PREFIX = "alive:promo:"

function storageGet(store: "session" | "local", key: string) {
  try {
    return (store === "session" ? sessionStorage : localStorage).getItem(STORAGE_PREFIX + key)
  } catch {
    return null
  }
}

function storageSet(store: "session" | "local", key: string, value: string) {
  try {
    ;(store === "session" ? sessionStorage : localStorage).setItem(STORAGE_PREFIX + key, value)
  } catch {
    // Private mode / blocked storage: overlays may repeat, which is acceptable.
  }
}

function canShow(banner: PublicPromoBanner) {
  if (banner.format === "special_boost") {
    const last = Number(storageGet("local", `boost:${banner.id}`) ?? 0)
    return Date.now() - last > BOOST_COOLDOWN_MS
  }
  return !storageGet("session", `seen:${banner.id}`)
}

function markShown(banner: PublicPromoBanner) {
  if (banner.format === "special_boost") storageSet("local", `boost:${banner.id}`, String(Date.now()))
  else storageSet("session", `seen:${banner.id}`, "1")
}

function pageFor(pathname: string, categories: { id: string; slug: string }[]): PromoPage | null {
  if (pathname === "/") return { type: "home" }
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length !== 1) return null
  const slug = decodeURIComponent(segments[0])
  const category = categories.find((c) => c.slug === slug)
  return category ? { type: "category", categoryId: category.id } : null
}

export function PromoOverlays({
  banners,
  categories,
}: {
  banners: PublicPromoBanner[]
  categories: { id: string; slug: string }[]
}) {
  const pathname = usePathname()
  const [active, setActive] = useState<PublicPromoBanner | null>(null)

  useEffect(() => {
    // Deferred so the overlay appears after the page underneath has hydrated. All storage
    // reads/writes happen inside the timer so a cancelled run (StrictMode, fast navigation)
    // leaves no trace.
    const id = window.setTimeout(() => {
      // First page view of the browser session → prestitial territory; later views → interstitial.
      const firstViewOfSession = !storageGet("session", "started")
      storageSet("session", "started", "1")

      const page = pageFor(pathname, categories)
      if (!page) return

      const eligible = banners.filter((b) => bannerTargetsPage(b, page) && canShow(b))
      const takeoverFormat = firstViewOfSession ? "prestitial" : "interstitial"
      const pick =
        eligible.find((b) => b.format === takeoverFormat) ?? eligible.find((b) => b.format === "special_boost")
      if (!pick) return

      markShown(pick)
      setActive(pick)
    }, 0)
    return () => window.clearTimeout(id)
  }, [pathname, banners, categories])

  const close = useCallback(() => setActive(null), [])

  if (!active) return null
  return active.format === "special_boost" ? (
    <SpecialBoost key={active.id} banner={active} onClose={close} />
  ) : (
    <Takeover key={active.id} banner={active} onClose={close} />
  )
}

/** Shared modal behaviour: scroll lock, Escape to close, focus the close button. */
function useModal(onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return closeRef
}

/** Prestitial / interstitial: page-covering takeover with a countdown and "continue to site". */
function Takeover({ banner, onClose }: { banner: PublicPromoBanner; onClose: () => void }) {
  const closeRef = useModal(onClose)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS)

  useEffect(() => {
    const id = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) onClose()
  }, [secondsLeft, onClose])

  const isPrestitial = banner.format === "prestitial"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Διαφήμιση"
      className="fixed inset-0 z-[100] flex flex-col"
      style={
        isPrestitial
          ? { backgroundColor: "var(--bg)" }
          : { backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }
      }
    >
      <div
        className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6"
        style={isPrestitial ? { borderBottom: "1px solid var(--border)" } : undefined}
      >
        {isPrestitial ? (
          <Logo size="sm" showTag={false} />
        ) : (
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">Διαφήμιση</span>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
          style={
            isPrestitial
              ? { backgroundColor: "var(--fg)", color: "var(--bg)" }
              : { backgroundColor: "#fff", color: "#111" }
          }
        >
          Συνέχεια στο site
          <span className="tabular-nums opacity-60">{Math.max(secondsLeft, 0)}</span>
          <X size={14} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4">
        {isPrestitial && (
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--fg-3)" }}>
            Διαφήμιση
          </span>
        )}
        <PromoLink banner={banner} onClick={onClose} className="block min-h-0 max-w-full overflow-hidden rounded-xl">
          <PromoPicture
            banner={banner}
            eager
            sizes="(max-width: 1440px) 92vw, 1320px"
            className="mx-auto block h-auto max-h-[calc(100dvh-8rem)] w-auto max-w-full object-contain"
          />
        </PromoLink>
      </div>

      {/* Countdown bar */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: isPrestitial ? "var(--bg-3)" : "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full bg-[#e63946] transition-[width] duration-1000 ease-linear"
          style={{ width: `${(Math.max(secondsLeft, 0) / AUTO_CLOSE_SECONDS) * 100}%` }}
        />
      </div>
    </div>
  )
}

/** Special Boost: full-screen popup with the visual over a dimmed page. */
function SpecialBoost({ banner, onClose }: { banner: PublicPromoBanner; onClose: () => void }) {
  const closeRef = useModal(onClose)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Διαφήμιση"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative max-h-full max-w-full">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Κλείσιμο"
          className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg ring-2 ring-white/80 transition-transform hover:scale-105"
        >
          <X size={18} />
        </button>
        <PromoLink banner={banner} onClick={onClose} className="block overflow-hidden rounded-2xl shadow-2xl">
          <PromoPicture
            banner={banner}
            eager
            sizes="(max-width: 1280px) 92vw, 1200px"
            className="block h-auto max-h-[calc(100dvh-4rem)] w-auto max-w-[min(92vw,1200px)] object-contain"
          />
        </PromoLink>
        <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
          Διαφήμιση
        </p>
      </div>
    </div>
  )
}
