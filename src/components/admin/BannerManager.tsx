"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Pause,
  Play,
  Upload,
  ImagePlus,
  Monitor,
  Smartphone,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react"
import { MediaPickerModal } from "@/components/admin/MediaPickerModal"
import { BannerPreview } from "@/components/admin/BannerPreview"
import { fromDateTimeLocalValue, toDateTimeLocalValue, formatDateTime } from "@/lib/datetime"
import {
  PROMO_ARTICLE_SCOPES,
  PROMO_DEVICES,
  PROMO_FORMATS,
  PROMO_FORMAT_LABELS,
  promoBannerStatus,
  type PromoBannerStatus,
  type PublicPromoBanner,
} from "@/lib/promo-banners"
import { prepareImageForUpload, measureImage, formatBytes, MAX_UPLOAD_BYTES } from "@/lib/image-compress"
import type { PromoBanner, PromoBannerCategoryScope, PromoBannerDevice, PromoBannerFormat } from "@/types"

interface CategoryOption {
  id: string
  name: string
  slug: string
  color: string | null
}

/** All-time totals per banner, from the site analytics. */
export interface BannerTotals {
  impressions: number
  clicks: number
}

interface Props {
  initial: PromoBanner[]
  categories: CategoryOption[]
  totals: Record<string, BannerTotals>
}

type BannerInput = Omit<PromoBanner, "id" | "created_at" | "updated_at">

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif"

const SIZE_HINTS: Record<PromoBannerFormat, { key: string; mobile: string }> = {
  standard: {
    key: "Desktop side rail: 300×600 (or 160×600). Also used in the feed when no mobile visual is set.",
    mobile: "In-feed on mobile: 300×250 or 336×280.",
  },
  prestitial: { key: "Landscape, e.g. 1920×1080.", mobile: "Portrait, e.g. 1080×1920." },
  interstitial: { key: "Landscape, e.g. 1920×1080.", mobile: "Portrait, e.g. 1080×1920." },
  special_boost: { key: "e.g. 1200×800 or 1080×1080.", mobile: "e.g. 1080×1350 or 1080×1920." },
}

const STATUS_STYLES: Record<PromoBannerStatus, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-500/15 text-emerald-600" },
  scheduled: { label: "Scheduled", className: "bg-amber-500/15 text-amber-600" },
  expired: { label: "Expired", className: "bg-neutral-500/15 text-neutral-500" },
  paused: { label: "Paused", className: "bg-sky-500/15 text-sky-600" },
}

/** Outlined secondary buttons: pointer, hover tint, slight press. */
const outlineButton =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-2)] transition-colors duration-150 hover:border-[var(--fg-3)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"

const inputStyle = { backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }
const inputClass = "w-full rounded-lg px-3 py-2 text-sm outline-none"

function defaultDates() {
  // Starts now, so a new banner is live as soon as it's saved (not "Scheduled" for up to an hour).
  const start = new Date()
  start.setSeconds(0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 14)
  end.setDate(end.getDate() + 14)
  return { starts_at: start.toISOString(), ends_at: end.toISOString() }
}

function emptyBanner(): BannerInput {
  return {
    name: "",
    image_url: "",
    image_width: null,
    image_height: null,
    mobile_image_url: null,
    mobile_image_width: null,
    mobile_image_height: null,
    alt_text: null,
    destination_url: "",
    format: "standard",
    ...defaultDates(),
    show_on_home: true,
    category_scope: "all",
    category_ids: [],
    article_scope: "none",
    device: "all",
    max_impressions: null,
    max_clicks: null,
    priority: 0,
    weight: 1,
    is_active: true,
  }
}

/** The fields the public site uses — what the preview renders. */
function toPublic(b: BannerInput & { id?: string }): PublicPromoBanner {
  return {
    id: b.id ?? "preview",
    image_url: b.image_url,
    image_width: b.image_width,
    image_height: b.image_height,
    mobile_image_url: b.mobile_image_url,
    mobile_image_width: b.mobile_image_width,
    mobile_image_height: b.mobile_image_height,
    alt_text: b.alt_text,
    destination_url: b.destination_url || "#",
    format: b.format,
    show_on_home: b.show_on_home,
    category_scope: b.category_scope,
    category_ids: b.category_ids,
    article_scope: b.article_scope,
    device: b.device,
    priority: b.priority,
    weight: b.weight,
  }
}

function parseCap(value: string) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatCount(n: number) {
  return new Intl.NumberFormat("el-GR").format(n)
}

async function uploadImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image (JPG, PNG, WebP or GIF)")
  const prepared = await prepareImageForUpload(file)
  if (prepared.file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${file.type === "image/gif" ? "GIF" : "Image"} is ${formatBytes(prepared.file.size)} — max ${formatBytes(MAX_UPLOAD_BYTES)}. ` +
        (file.type === "image/gif" ? "Reduce frames/colours or dimensions and try again." : "Try a smaller image.")
    )
  }
  const ext = prepared.file.name.split(".").pop()
  const name = `banner-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const fd = new FormData()
  fd.append("file", prepared.file)
  fd.append("name", name)
  const res = await fetch("/api/admin/media", { method: "POST", body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Upload failed")
  return { url: data.url as string, ...prepared }
}

// ─── Visual field ───────────────────────────────────────────

function VisualField({
  label,
  icon: Icon,
  hint,
  url,
  width,
  height,
  optional,
  onChange,
}: {
  label: string
  icon: typeof Monitor
  hint: string
  url: string | null
  width: number | null
  height: number | null
  optional?: boolean
  onChange: (value: { url: string | null; width: number | null; height: number | null }) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedNote, setSavedNote] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setSavedNote(null)
    try {
      const uploaded = await uploadImage(file)
      onChange({ url: uploaded.url, width: uploaded.width, height: uploaded.height })
      if (uploaded.file.size < uploaded.originalBytes) {
        setSavedNote(`Compressed ${formatBytes(uploaded.originalBytes)} → ${formatBytes(uploaded.file.size)}`)
      } else {
        setSavedNote(`${formatBytes(uploaded.file.size)}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handlePick(picked: string) {
    setSavedNote(null)
    const size = await measureImage(picked)
    onChange({ url: picked, width: size?.width ?? null, height: size?.height ?? null })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-3)" }}>
        <Icon size={12} />
        <span>
          {label}
          {optional && " (optional)"}
        </span>
      </div>

      <div
        className="relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: "var(--bg-3)", border: "1px dashed var(--border)" }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-[220px] w-auto max-w-full object-contain" />
        ) : (
          <p className="px-4 text-center text-xs" style={{ color: "var(--fg-3)" }}>
            {optional ? "Not set — the key visual is used on every screen." : "No visual yet"}
          </p>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
            Compressing &amp; uploading…
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`${outlineButton} px-3 py-1.5 text-xs font-semibold`}
          title="Choose an image from your computer (JPG, PNG, WebP or GIF)"
        >
          <Upload size={12} />
          Upload JPG / PNG / GIF
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`${outlineButton} px-3 py-1.5 text-xs font-semibold`}
          title="Pick an image already in the media library"
        >
          <ImagePlus size={12} />
          From library
        </button>
        {optional && url && (
          <button
            type="button"
            onClick={() => {
              setSavedNote(null)
              onChange({ url: null, width: null, height: null })
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--fg-3)] transition-colors duration-150 hover:bg-red-500/10 hover:text-red-500"
            title="Remove the mobile visual (the key visual is used everywhere)"
          >
            <X size={12} />
            Remove
          </button>
        )}
      </div>

      <p className="text-[11px] leading-snug" style={{ color: "var(--fg-3)" }}>
        {hint}
        {url && width && height ? ` · Current: ${width}×${height}` : ""}
        {savedNote ? ` · ${savedNote}` : ""}
      </p>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
        title={`Choose ${label.toLowerCase()}`}
      />
    </div>
  )
}

// ─── Form ───────────────────────────────────────────────────

function BannerForm({
  initial,
  categories,
  onSave,
  onCancel,
}: {
  initial: BannerInput & { id?: string }
  categories: CategoryOption[]
  onSave: (data: BannerInput & { id?: string }) => Promise<boolean>
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const [startsAt, setStartsAt] = useState(toDateTimeLocalValue(initial.starts_at))
  const [endsAt, setEndsAt] = useState(toDateTimeLocalValue(initial.ends_at))
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  function set<K extends keyof BannerInput>(key: K, value: BannerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.image_url) {
      toast.error("Add a key visual")
      return
    }
    let starts_at: string
    let ends_at: string
    try {
      starts_at = fromDateTimeLocalValue(startsAt)
      ends_at = fromDateTimeLocalValue(endsAt)
    } catch {
      toast.error("Please set both start and end dates")
      return
    }
    if (new Date(ends_at) <= new Date(starts_at)) {
      toast.error("End date must be after the start date")
      return
    }
    if (form.article_scope === "categories" && form.category_scope === "none") {
      toast.error("“Articles in the categories above” needs category targeting (all or selected)")
      return
    }
    if (!form.show_on_home && form.category_scope === "none" && form.article_scope === "none") {
      toast.error("Choose at least one page where the banner appears")
      return
    }
    if (form.category_scope === "selected" && form.category_ids.length === 0) {
      toast.error("Pick at least one category")
      return
    }
    setSaving(true)
    await onSave({ ...form, starts_at, ends_at, destination_url: form.destination_url.trim() })
    setSaving(false)
  }

  const hints = SIZE_HINTS[form.format]

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl p-4 sm:p-5"
      style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      {/* Basics */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Name (internal)</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            maxLength={120}
            placeholder="e.g. Release Athens 2026 — teaser"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Destination URL</label>
          <input
            value={form.destination_url}
            onChange={(e) => set("destination_url", e.target.value)}
            required
            placeholder="https://… or /culture/some-article"
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Format */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs" style={{ color: "var(--fg-3)" }}>Format</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROMO_FORMATS.map((f) => {
            const active = form.format === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => set("format", f.value)}
                className={`cursor-pointer rounded-lg border p-3 text-left transition-all duration-150 active:scale-[0.99] ${
                  active
                    ? "border-[#e63946] bg-[rgba(230,57,70,0.06)]"
                    : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--fg-3)] hover:shadow-sm"
                }`}
                aria-pressed={active}
              >
                <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  <span
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${active ? "#e63946" : "var(--border)"}` }}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[#e63946]" />}
                  </span>
                  {f.label}
                </span>
                <span className="mt-1 block text-xs leading-snug" style={{ color: "var(--fg-3)" }}>
                  {f.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Visuals */}
      <div className="grid gap-4 sm:grid-cols-2">
        <VisualField
          label="Key visual"
          icon={Monitor}
          hint={hints.key}
          url={form.image_url || null}
          width={form.image_width}
          height={form.image_height}
          onChange={({ url, width, height }) =>
            setForm((prev) => ({ ...prev, image_url: url ?? "", image_width: width, image_height: height }))
          }
        />
        <VisualField
          label="Mobile visual"
          icon={Smartphone}
          hint={hints.mobile}
          url={form.mobile_image_url}
          width={form.mobile_image_width}
          height={form.mobile_image_height}
          optional
          onChange={({ url, width, height }) =>
            setForm((prev) => ({
              ...prev,
              mobile_image_url: url,
              mobile_image_width: width,
              mobile_image_height: height,
            }))
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs" style={{ color: "var(--fg-3)" }}>Alt text</label>
        <input
          value={form.alt_text ?? ""}
          onChange={(e) => set("alt_text", e.target.value || null)}
          maxLength={200}
          placeholder="Describe the visual for screen readers"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Duration */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Start (Athens time)</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>End (Athens time)</label>
          <input
            type="datetime-local"
            value={endsAt}
            min={startsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Placement */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs" style={{ color: "var(--fg-3)" }}>Where it appears</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--fg)" }}>
          <input
            type="checkbox"
            checked={form.show_on_home}
            onChange={(e) => set("show_on_home", e.target.checked)}
            className="accent-[#e63946]"
          />
          Homepage
        </label>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--fg)" }}>
            <span>Category pages:</span>
            {(
              [
                ["none", "None"],
                ["all", "All categories"],
                ["selected", "Selected"],
              ] as [PromoBannerCategoryScope, string][]
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="category_scope"
                  checked={form.category_scope === value}
                  onChange={() => set("category_scope", value)}
                  className="accent-[#e63946]"
                />
                {label}
              </label>
            ))}
          </div>
          {form.category_scope === "selected" && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const on = form.category_ids.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-[var(--fg)] transition-colors duration-150 ${
                      on ? "" : "border-[var(--border)] hover:border-[var(--fg-3)] hover:bg-[var(--bg-3)]"
                    }`}
                    style={on ? { borderColor: cat.color ?? "#e63946", backgroundColor: `${cat.color ?? "#e63946"}22` } : undefined}
                    title={on ? `Remove ${cat.name}` : `Show on ${cat.name}`}
                    aria-pressed={on}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? "#e63946" }} />
                    {cat.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--fg)" }}>
          <span>Article pages:</span>
          {PROMO_ARTICLE_SCOPES.map(([value, label]) => {
            const disabled = value === "categories" && form.category_scope === "none"
            return (
              <label
                key={value}
                className={`flex items-center gap-1.5 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                style={{ opacity: disabled ? 0.45 : 1 }}
                title={disabled ? "Choose category pages above first" : undefined}
              >
                <input
                  type="radio"
                  name="article_scope"
                  checked={form.article_scope === value}
                  disabled={disabled}
                  onChange={() => set("article_scope", value)}
                  className="accent-[#e63946]"
                />
                {label}
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Device + caps */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Devices</label>
          <select
            value={form.device}
            onChange={(e) => set("device", e.target.value as PromoBannerDevice)}
            className={`${inputClass} cursor-pointer`}
            style={inputStyle}
          >
            {PROMO_DEVICES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Stop after impressions (optional)</label>
          <input
            type="number"
            min={1}
            value={form.max_impressions ?? ""}
            onChange={(e) => set("max_impressions", parseCap(e.target.value))}
            placeholder="No limit"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Stop after clicks (optional)</label>
          <input
            type="number"
            min={1}
            value={form.max_clicks ?? ""}
            onChange={(e) => set("max_clicks", parseCap(e.target.value))}
            placeholder="No limit"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <p className="text-[11px] sm:col-span-3" style={{ color: "var(--fg-3)" }}>
          Phones are screens under 768px. Caps count all-time totals from Analytics; the banner stops within about a
          minute of reaching either one.
        </p>
      </div>

      {/* Priority + active */}
      <div className="flex flex-wrap items-end gap-6">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Priority</label>
          <input
            type="number"
            min={-100}
            max={100}
            value={form.priority}
            onChange={(e) => set("priority", Number.parseInt(e.target.value || "0", 10) || 0)}
            className="w-24 rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Weight</label>
          <select
            value={form.weight}
            onChange={(e) => set("weight", Number(e.target.value))}
            className="w-28 cursor-pointer rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                {w}×{w === 1 ? " (normal)" : ""}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm" style={{ color: "var(--fg)" }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="accent-[#e63946]"
          />
          Active
        </label>
        <p className="pb-2 text-xs" style={{ color: "var(--fg-3)" }}>
          Higher priority always gets the first spots. Banners with the same priority take turns by weight:
          2× shows about twice as often as 1×.
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#e63946] px-3 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#c9303d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={13} />
          {saving ? "Saving…" : "Save banner"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!form.image_url) {
              toast.error("Add a key visual to preview")
              return
            }
            setPreviewing(true)
          }}
          className={`${outlineButton} px-3 py-1.5 text-sm`}
          title="See how this banner will look on the site, before saving"
        >
          <Eye size={13} />
          Preview
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`${outlineButton} px-3 py-1.5 text-sm`}
          title="Close without saving"
        >
          <X size={13} />
          Cancel
        </button>
      </div>
      {previewing && <BannerPreview banner={toPublic(form)} onClose={() => setPreviewing(false)} />}
    </form>
  )
}

// ─── Manager ────────────────────────────────────────────────

export function BannerManager({ initial, categories, totals }: Props) {
  const router = useRouter()
  const [banners, setBanners] = useState(initial)
  // A new banner's starting values: empty, or a copy of an existing banner.
  const [draft, setDraft] = useState<BannerInput | null>(null)
  const [previewing, setPreviewing] = useState<PromoBanner | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<PromoBannerStatus | "all">("all")

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  function placementSummary(b: PromoBanner) {
    const parts: string[] = []
    if (b.show_on_home) parts.push("Homepage")
    if (b.category_scope === "all") parts.push("All categories")
    if (b.category_scope === "selected") {
      parts.push(b.category_ids.map((id) => categoryNames.get(id) ?? "Deleted category").join(", "))
    }
    if (b.article_scope === "all") parts.push("All articles")
    if (b.article_scope === "categories") parts.push("Their articles")
    if (b.device === "desktop") parts.push("Desktop only")
    if (b.device === "mobile") parts.push("Phones only")
    if (b.priority !== 0) parts.push(`Priority ${b.priority}`)
    if (b.weight !== 1) parts.push(`Weight ${b.weight}×`)
    return parts.join(" · ") || "Nowhere"
  }

  async function save(data: BannerInput & { id?: string }) {
    const { id, ...body } = data
    const res = await fetch(id ? `/api/admin/banners/${id}` : "/api/admin/banners", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error ?? "Failed to save banner")
      return false
    }
    setBanners((prev) =>
      id ? prev.map((b) => (b.id === id ? json : b)) : [json, ...prev]
    )
    setDraft(null)
    setEditingId(null)
    toast.success(id ? "Banner updated" : "Banner created")
    router.refresh()
    return true
  }

  async function toggleActive(banner: PromoBanner) {
    const res = await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !banner.is_active }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update banner")
      return
    }
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? json : b)))
    toast.success(json.is_active ? "Banner resumed" : "Banner paused")
  }

  async function handleDelete(banner: PromoBanner) {
    if (!confirm(`Delete banner "${banner.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? "Failed to delete banner")
      return
    }
    setBanners((prev) => prev.filter((b) => b.id !== banner.id))
    toast.success("Banner deleted")
    router.refresh()
  }

  const withStatus = banners.map((b) => ({ banner: b, status: promoBannerStatus(b) }))
  const visible = filter === "all" ? withStatus : withStatus.filter((b) => b.status === filter)

  return (
    <div className="max-w-4xl space-y-4">
      {previewing && <BannerPreview banner={toPublic(previewing)} onClose={() => setPreviewing(null)} />}
      {draft ? (
        <BannerForm
          initial={draft}
          categories={categories}
          onSave={save}
          onCancel={() => setDraft(null)}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              setEditingId(null)
              setDraft(emptyBanner())
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#e63946] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#c9303d] active:scale-[0.98]"
          >
            <Plus size={14} />
            New Banner
          </button>
          <div className="flex flex-wrap gap-1">
            {(["all", "live", "scheduled", "paused", "expired"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors duration-150 ${
                  filter === s
                    ? "bg-[var(--bg-3)] text-[var(--fg)]"
                    : "text-[var(--fg-3)] hover:bg-[var(--bg-3)]/60 hover:text-[var(--fg)]"
                }`}
                title={s === "all" ? "Show every banner" : `Show only ${s} banners`}
                aria-pressed={filter === s}
              >
                {s === "all" ? `All (${banners.length})` : `${s} (${withStatus.filter((b) => b.status === s).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not overflow-hidden: the action info boxes may extend above the first row. */}
      <div className="rounded-xl" style={{ border: "1px solid var(--border)" }}>
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--fg-3)" }}>
            {banners.length === 0 ? "No banners yet." : "No banners match this filter."}
          </p>
        )}
        {visible.map(({ banner, status }) =>
          editingId === banner.id ? (
            <div key={banner.id} className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <BannerForm
                initial={banner}
                categories={categories}
                onSave={save}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={banner.id}
              className="flex flex-col gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl sm:flex-row sm:items-center"
              style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
            >
              <div
                className="flex h-16 w-full shrink-0 items-center justify-center overflow-hidden rounded-md sm:w-28"
                style={{ backgroundColor: "var(--bg-3)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.image_url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{banner.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status].className}`}>
                    {STATUS_STYLES[status].label}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: "var(--bg-3)", color: "var(--fg-2)" }}
                  >
                    {PROMO_FORMAT_LABELS[banner.format]}
                  </span>
                  {banner.mobile_image_url && (
                    <span title="Has a mobile visual" style={{ color: "var(--fg-3)" }}>
                      <Smartphone size={12} />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--fg-3)" }}>
                  {formatDateTime(banner.starts_at)} → {formatDateTime(banner.ends_at)}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "var(--fg-3)" }}>
                  {placementSummary(banner)} ·{" "}
                  <a
                    href={banner.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 hover:underline"
                  >
                    {banner.destination_url}
                    <ExternalLink size={10} />
                  </a>
                </p>
                <BannerStatsLine banner={banner} totals={totals[banner.id]} />
              </div>

              <div className="flex items-center gap-1">
                <ActionButton label="Preview" hint="See how it looks on the site" onClick={() => setPreviewing(banner)}>
                  <Eye size={14} />
                </ActionButton>
                <ActionButton
                  label="Duplicate"
                  hint="Copy into a new banner (starts paused)"
                  onClick={() => {
                    setEditingId(null)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, created_at, updated_at, ...copy } = banner
                    // Copies start paused so a campaign never runs twice by accident.
                    setDraft({ ...copy, name: `${banner.name} (copy)`.slice(0, 120), is_active: false })
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  <Copy size={14} />
                </ActionButton>
                <ActionButton
                  label={banner.is_active ? "Pause" : "Resume"}
                  hint={banner.is_active ? "Stop showing it on the site" : "Show it on the site again"}
                  onClick={() => toggleActive(banner)}
                >
                  {banner.is_active ? <Pause size={14} /> : <Play size={14} />}
                </ActionButton>
                <ActionButton
                  label="Edit"
                  hint="Change visuals, dates or targeting"
                  onClick={() => {
                    setDraft(null)
                    setEditingId(banner.id)
                  }}
                >
                  <Pencil size={14} />
                </ActionButton>
                <ActionButton label="Delete" hint="Remove permanently" danger align="end" onClick={() => handleDelete(banner)}>
                  <Trash2 size={14} />
                </ActionButton>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function BannerStatsLine({ banner, totals }: { banner: PromoBanner; totals?: BannerTotals }) {
  const impressions = totals?.impressions ?? 0
  const clicks = totals?.clicks ?? 0
  const ctr = impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : "—"
  const caps = [
    banner.max_impressions != null && `cap ${formatCount(banner.max_impressions)} impressions`,
    banner.max_clicks != null && `cap ${formatCount(banner.max_clicks)} clicks`,
  ].filter(Boolean)
  return (
    <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--fg-2)" }}>
      {formatCount(impressions)} impressions · {formatCount(clicks)} clicks · CTR {ctr}
      {caps.length > 0 && <span style={{ color: "var(--fg-3)" }}> · {caps.join(", ")}</span>}
    </p>
  )
}

/** Icon button for the banner list: pointer cursor, hover tint, and an info box on hover or keyboard focus. */
function ActionButton({
  label,
  hint,
  onClick,
  danger,
  align = "center",
  children,
}: {
  label: string
  hint: string
  onClick: () => void
  danger?: boolean
  /** "end" keeps the info box inside the list on the last button */
  align?: "center" | "end"
  children: React.ReactNode
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label} banner`}
        className={`cursor-pointer rounded-md p-1.5 text-[var(--fg-3)] transition-colors duration-150 hover:bg-[var(--bg-3)] focus-visible:bg-[var(--bg-3)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fg-3)] active:scale-95 ${
          danger ? "hover:text-red-500 focus-visible:text-red-500" : "hover:text-[var(--fg)] focus-visible:text-[var(--fg)]"
        }`}
      >
        {children}
      </button>
      <span
        role="tooltip"
        aria-hidden
        className={`pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-[220px] translate-y-1 rounded-lg px-2.5 py-1.5 text-left opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-has-[:focus-visible]:translate-y-0 group-has-[:focus-visible]:opacity-100 ${
          align === "end" ? "right-0" : "left-1/2 -translate-x-1/2"
        }`}
        style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}
      >
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[11px] opacity-75">{hint}</span>
      </span>
    </span>
  )
}
