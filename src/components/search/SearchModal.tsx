"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X, ArrowRight } from "lucide-react"

interface Result {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
  published_at: string | null
  category: { name: string; slug: string; color: string | null }
}

interface Props {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setResults([])
      setSelected(0)
    }
  }, [open])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        open ? onClose() : void 0
      }
      if (e.key === "Escape" && open) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || query.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        setResults(await res.json())
        setSelected(0)
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const navigate = useCallback((r: Result) => {
    router.push(`/${r.category.slug}/${r.slug}`)
    onClose()
  }, [router, onClose])

  // Arrow key navigation
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
      if (e.key === "Enter" && results[selected]) navigate(results[selected])
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, results, selected, navigate])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl mx-auto mt-16 sm:mt-24 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search size={18} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="flex-1 text-base outline-none bg-transparent"
            style={{ color: "var(--fg)" }}
          />
          {loading && (
            <span className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>
              Searching…
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--fg-3)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[60vh] overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors"
                  style={{ backgroundColor: i === selected ? "var(--bg-2)" : "transparent" }}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => navigate(r)}
                >
                  {r.cover_image_url && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={r.cover_image_url} alt={r.title} fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 text-black mb-1"
                      style={{ backgroundColor: r.category.color ?? "#e63946" }}
                    >
                      {r.category.name}
                    </span>
                    <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--fg)" }}>
                      {r.title}
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--fg-3)" }}>
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer hint */}
        {results.length === 0 && query.length < 2 && (
          <div className="px-5 py-4 flex items-center gap-4 text-xs" style={{ color: "var(--fg-3)" }}>
            <span><kbd className="px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--border)" }}>↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--border)" }}>↵</kbd> open</span>
            <span><kbd className="px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--border)" }}>esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  )
}
