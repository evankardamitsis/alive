import type { PromoPlacement } from "@/lib/promo-banners"

// Browser-only: sends an analytics event to /api/track without delaying navigation.

/**
 * Staff browsers are left out of analytics. The admin sets this cookie to "1" (excluded) on any
 * browser that opens it, unless someone chose "0" (count this browser) on the Analytics page.
 * /api/track checks it too.
 */
export const INTERNAL_COOKIE = "alive_internal"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 730 // two years

export function readInternalFlag(): "1" | "0" | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${INTERNAL_COOKIE}=([01])`))
  return (m?.[1] as "1" | "0" | undefined) ?? null
}

export function writeInternalFlag(value: "1" | "0") {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${INTERNAL_COOKIE}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
}

type TrackEvent =
  | { type: "pageview"; referrer?: string }
  | { type: "impression" | "click"; bannerId: string; placement: PromoPlacement }

export function track(event: TrackEvent) {
  if (typeof window === "undefined") return
  if (readInternalFlag() === "1") return // staff browser
  const body = JSON.stringify({ ...event, path: window.location.pathname })
  try {
    // sendBeacon survives the page unloading (e.g. a click that leaves the site).
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return
  } catch {
    // fall through to fetch
  }
  fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
    () => {}
  )
}
