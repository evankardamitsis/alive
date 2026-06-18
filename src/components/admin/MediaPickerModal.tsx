"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Upload, Check, Search } from "lucide-react"
import NextImage from "next/image"

interface MediaItem {
  name: string
  url: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export function MediaPickerModal({ open, onClose, onSelect }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/media/list")
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) { setSelected(null); setQuery(""); load() }
  }, [open, load])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      const ext = file.name.split(".").pop()
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const fd = new FormData()
      fd.append("file", file)
      fd.append("name", name)
      await fetch("/api/admin/media", { method: "POST", body: fd })
    }
    setUploading(false)
    await load()
  }

  function handleConfirm() {
    if (selected) { onSelect(selected); onClose() }
  }

  const filtered = items.filter((i) =>
    !query || i.name.toLowerCase().includes(query.toLowerCase())
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Choose cover image</h2>
          <div className="flex items-center gap-2">
            <label
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
            >
              <Upload size={12} />
              {uploading ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--fg-3)" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--fg-3)" }} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by filename…"
              className="w-full rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--fg-3)" }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--fg-3)" }}>No images found.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => setSelected(item.url === selected ? null : item.url)}
                  className="relative rounded-lg overflow-hidden aspect-square group"
                  style={{
                    border: `2px solid ${selected === item.url ? "#e63946" : "var(--border)"}`,
                  }}
                >
                  <NextImage
                    src={item.url}
                    alt={item.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                    unoptimized
                  />
                  {selected === item.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#e63946]/30">
                      <div className="w-6 h-6 rounded-full bg-[#e63946] flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                    <p className="text-[9px] text-white truncate">{item.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>
            {selected ? "1 image selected" : `${filtered.length} images`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors disabled:opacity-40"
            >
              Use image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
