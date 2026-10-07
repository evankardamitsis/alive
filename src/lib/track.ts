import type { PromoPlacement } from "@/lib/promo-banners"

// Browser-only: sends an analytics event to /api/track without delaying navigation.

type TrackEvent =
  | { type: "pageview"; referrer?: string }
  | { type: "impression" | "click"; bannerId: string; placement: PromoPlacement }

export function track(event: TrackEvent) {
  if (typeof window === "undefined") return
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
