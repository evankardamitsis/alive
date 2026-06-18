"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useRef, useEffect } from "react"
import { Search } from "lucide-react"

export function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set("q", q)
    else params.delete("q")
    startTransition(() => {
      router.replace(`/search?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--fg-3)" }}
      />
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search articles…"
        className="w-full rounded-xl pl-11 pr-4 py-3.5 text-base outline-none transition-colors"
        style={{
          backgroundColor: "var(--bg-2)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          opacity: isPending ? 0.6 : 1,
        }}
      />
    </div>
  )
}
