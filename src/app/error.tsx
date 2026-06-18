"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-[8rem] font-black leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--border)" }}>
        500
      </p>
      <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--fg)" }}>
        Κάτι πήγε στραβά
      </h1>
      <p className="mt-3 text-sm max-w-xs" style={{ color: "var(--fg-3)" }}>
        Παρουσιάστηκε κάποιο τεχνικό πρόβλημα. Δοκίμασε ξανά.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-block rounded-full bg-[#e63946] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors"
      >
        Δοκίμασε ξανά
      </button>
    </div>
  )
}
