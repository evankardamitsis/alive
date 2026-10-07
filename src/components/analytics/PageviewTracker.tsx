"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { track } from "@/lib/track"

/** Records one page view per public page, including client-side navigations. */
export function PageviewTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    // Guards against effects re-running for the same page (StrictMode, re-renders).
    if (lastTracked.current === pathname) return
    // Only the landing page can carry an outside referrer; later views are in-site navigation.
    const landing = lastTracked.current === null
    lastTracked.current = pathname
    track({ type: "pageview", referrer: landing ? document.referrer || undefined : undefined })
  }, [pathname])

  return null
}
