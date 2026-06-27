"use client"

import { useEffect, useRef, useState } from "react"
import { Link2, X } from "lucide-react"

interface Props {
  open: boolean
  initialUrl?: string
  hasSelection: boolean
  onClose: () => void
  onSubmit: (url: string, text?: string) => void
  onRemove?: () => void
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function EditorLinkDialog({
  open,
  initialUrl = "",
  hasSelection,
  onClose,
  onSubmit,
  onRemove,
}: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUrl(initialUrl)
      setText("")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open, initialUrl])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const href = normalizeUrl(url)
    if (!href) return
    onSubmit(href, text.trim() || undefined)
    onClose()
  }

  const inputStyle = {
    backgroundColor: "var(--bg-3)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Link2 size={16} style={{ color: "var(--fg-2)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              {initialUrl ? "Edit link" : "Insert link"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--fg-3)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>URL</label>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {!hasSelection && (
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>
                Link text <span style={{ color: "var(--fg-3)" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Leave empty to use the URL"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          )}

          <p className="text-xs" style={{ color: "var(--fg-3)" }}>
            Opens in a new tab
          </p>

          <div className="flex items-center justify-between gap-2 pt-1">
            {initialUrl && onRemove ? (
              <button
                type="button"
                onClick={() => { onRemove(); onClose() }}
                className="text-xs underline"
                style={{ color: "#e63946" }}
              >
                Remove link
              </button>
            ) : (
              <span />
            )}
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
                type="submit"
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors"
              >
                {initialUrl ? "Update link" : "Insert link"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
