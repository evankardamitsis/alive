"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Upload, Copy, Trash2, Check, Search, X,
  ChevronLeft, ChevronRight, Pencil,
} from "lucide-react"
import NextImage from "next/image"

interface MediaItem {
  name: string
  path: string
  url: string
  size: number
  created_at: string
}

interface Props {
  items: MediaItem[]
  bucketBaseUrl: string
  page: number
  totalPages: number
  total: number
  searchQuery: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaManager({ items, bucketBaseUrl, page, totalPages, total, searchQuery }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deletedPaths, setDeletedPaths] = useState<Set<string>>(new Set())
  const [localItems, setLocalItems] = useState(items)
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [renameError, setRenameError] = useState("")
  const [renameSaving, setRenameSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  // Keep localItems in sync when server re-renders a new page
  useEffect(() => { setLocalItems(items) }, [items])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (renaming) { setRenaming(false); return }
        setPreview(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [renaming])

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (!arr.length) {
      toast.error("Only image files can be uploaded")
      return
    }
    setUploading(true)
    let uploaded = 0
    for (const file of arr) {
      const ext = file.name.split(".").pop()
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const fd = new FormData()
      fd.append("file", file)
      fd.append("name", name)
      const res = await fetch("/api/admin/media", { method: "POST", body: fd })
      if (res.ok) uploaded++
    }
    setUploading(false)
    if (uploaded === arr.length) {
      toast.success(uploaded === 1 ? "Image uploaded" : `${uploaded} images uploaded`)
    } else {
      toast.error("Some uploads failed")
    }
    router.push("/admin/media")
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }, [])

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success("URL copied to clipboard")
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  async function deleteFile(item: MediaItem) {
    if (!confirm(`Delete "${item.name}"?`)) return
    const res = await fetch(`/api/admin/media/${encodeURIComponent(item.path)}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to delete image")
      return
    }
    setDeletedPaths((prev) => new Set([...prev, item.path]))
    if (preview?.path === item.path) setPreview(null)
    toast.success("Image deleted")
  }

  function openPreview(item: MediaItem) {
    setPreview(item)
    setRenaming(false)
    setRenameError("")
  }

  function startRename() {
    if (!preview) return
    setRenameValue(preview.name)
    setRenameError("")
    setRenaming(true)
    setTimeout(() => renameRef.current?.select(), 50)
  }

  async function saveRename() {
    if (!preview || !renameValue.trim()) return
    const newName = renameValue.trim()
    if (newName === preview.name) { setRenaming(false); return }
    setRenameSaving(true)
    setRenameError("")
    const res = await fetch(`/api/admin/media/${encodeURIComponent(preview.path)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName }),
    })
    const json = await res.json()
    setRenameSaving(false)
    if (!res.ok) {
      setRenameError(json.error ?? "Failed to rename")
      toast.error(json.error ?? "Failed to rename")
      return
    }

    const updated: MediaItem = { ...preview, name: newName, path: json.path, url: json.url }
    setLocalItems((prev) => prev.map((i) => i.path === preview.path ? updated : i))
    setPreview(updated)
    setRenaming(false)
    toast.success("Image renamed")
  }

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/admin/media${qs ? `?${qs}` : ""}`
  }

  const visible = localItems.filter((i) => !deletedPaths.has(i.path))

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
      acc.push(p)
      return acc
    }, [])

  const lightbox = preview ? (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
      onClick={() => { if (!renaming) setPreview(null) }}
    >
      <div
        className="relative w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--bg)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex-1 min-w-0">
            {renaming ? (
              <div className="flex items-center gap-2">
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(false) }}
                  className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
                />
                <button
                  onClick={saveRename}
                  disabled={renameSaving}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e63946] text-white disabled:opacity-50"
                >
                  <Check size={11} /> {renameSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setRenaming(false)}
                  className="p-1 rounded-lg"
                  style={{ color: "var(--fg-3)" }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{preview.name}</p>
                <button
                  onClick={startRename}
                  className="shrink-0 p-1 rounded"
                  style={{ color: "var(--fg-3)" }}
                  title="Rename"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
            {renameError && <p className="text-[11px] text-red-500 mt-0.5">{renameError}</p>}
            {!renaming && <p className="text-xs" style={{ color: "var(--fg-3)" }}>{formatSize(preview.size)}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyUrl(preview.url)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
            >
              {copiedUrl === preview.url ? <Check size={12} /> : <Copy size={12} />}
              {copiedUrl === preview.url ? "Copied!" : "Copy URL"}
            </button>
            <button
              onClick={() => deleteFile(preview)}
              className="p-1.5 rounded-lg text-red-500 transition-colors"
              style={{ border: "1px solid var(--border)" }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setPreview(null)}
              className="p-1.5 rounded-lg"
              style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-0" style={{ backgroundColor: "var(--bg-2)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.name}
            style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
          />
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl p-8 text-center cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragOver ? "#e63946" : "var(--border)"}`,
          backgroundColor: dragOver ? "rgba(230,57,70,0.04)" : "var(--bg-2)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <Upload size={24} className="mx-auto mb-2" style={{ color: uploading ? "#e63946" : "var(--fg-3)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--fg-2)" }}>
          {uploading ? "Uploading…" : "Drop images here or click to browse"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>JPG, PNG, WebP, GIF, SVG</p>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <form
          className="relative flex-1 max-w-xs"
          onSubmit={(e) => {
            e.preventDefault()
            const q = searchRef.current?.value.trim() ?? ""
            router.push(q ? `/admin/media?q=${encodeURIComponent(q)}` : "/admin/media")
          }}
        >
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--fg-3)" }} />
          <input
            ref={searchRef}
            type="search"
            defaultValue={searchQuery}
            placeholder="Search filenames…"
            className="w-full rounded-lg pl-8 pr-8 py-1.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { if (searchRef.current) searchRef.current.value = ""; router.push("/admin/media") }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--fg-3)" }}
            >
              <X size={13} />
            </button>
          )}
        </form>
        <p className="text-xs shrink-0" style={{ color: "var(--fg-3)" }}>
          {searchQuery ? `${total} result${total !== 1 ? "s" : ""}` : `${total} image${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: "var(--fg-3)" }}>
          {searchQuery ? `No images matching "${searchQuery}"` : "No media yet."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visible.map((item) => (
            <div
              key={item.path}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
              onClick={() => openPreview(item)}
            >
              <div className="aspect-square relative">
                <NextImage
                  src={item.url}
                  alt={item.name}
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  unoptimized
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-x-0 inset-y-0 bottom-[36px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/30">
                <span className="text-[11px] font-medium text-white/90">Click to view</span>
              </div>

              <div className="px-2 py-1.5">
                <p className="text-[11px] font-medium truncate" style={{ color: "var(--fg-2)" }}>{item.name}</p>
                <p className="text-[10px]" style={{ color: "var(--fg-3)" }}>{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <a
              href={pageHref(page - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ border: "1px solid var(--border)", color: page <= 1 ? "var(--fg-3)" : "var(--fg)", pointerEvents: page <= 1 ? "none" : undefined, opacity: page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </a>
            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`e-${i}`} className="w-8 text-center text-xs" style={{ color: "var(--fg-3)" }}>…</span>
              ) : (
                <a
                  key={p}
                  href={pageHref(p as number)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: p === page ? "#e63946" : "transparent", color: p === page ? "#fff" : "var(--fg)", border: `1px solid ${p === page ? "#e63946" : "var(--border)"}` }}
                >
                  {p}
                </a>
              )
            )}
            <a
              href={pageHref(page + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ border: "1px solid var(--border)", color: page >= totalPages ? "var(--fg-3)" : "var(--fg)", pointerEvents: page >= totalPages ? "none" : undefined, opacity: page >= totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Lightbox — portalled to body to escape overflow:hidden */}
      {typeof document !== "undefined" && lightbox && createPortal(lightbox, document.body)}
    </div>
  )
}
