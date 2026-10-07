"use client"

import { useEffect } from "react"
import { readInternalFlag, writeInternalFlag } from "@/lib/track"

/** Mounted in the admin: marks this browser as staff so its visits stay out of analytics. */
export function InternalVisitorMarker() {
  useEffect(() => {
    // "0" means someone chose to count this browser on the Analytics page; respect that.
    if (readInternalFlag() === null) writeInternalFlag("1")
  }, [])
  return null
}
