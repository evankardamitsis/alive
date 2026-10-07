"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, ShieldOff } from "lucide-react"
import { readInternalFlag, writeInternalFlag } from "@/lib/track"

/** Shows whether this browser's visits are left out of analytics, with a switch. */
export function InternalTrafficToggle() {
  const [excluded, setExcluded] = useState<boolean | null>(null)

  useEffect(() => {
    // Reading a cookie after mount; the server can't know this browser's choice when rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExcluded(readInternalFlag() !== "0")
  }, [])

  if (excluded === null) return null
  const Icon = excluded ? ShieldCheck : ShieldOff

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-4 py-3 text-sm"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)", color: "var(--fg-2)" }}
    >
      <Icon size={16} style={{ color: excluded ? "var(--viz-good)" : "var(--fg-3)" }} aria-hidden />
      <span className="flex-1">
        {excluded
          ? "Your visits from this browser are not counted. Staff browsers are excluded automatically, as are previews and local testing."
          : "Your visits from this browser are being counted."}
      </span>
      <button
        type="button"
        onClick={() => {
          const next = !excluded
          writeInternalFlag(next ? "1" : "0")
          setExcluded(next)
        }}
        className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--fg-2)] transition-colors duration-150 hover:border-[var(--fg-3)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)]"
      >
        {excluded ? "Count this browser" : "Exclude this browser"}
      </button>
    </div>
  )
}
