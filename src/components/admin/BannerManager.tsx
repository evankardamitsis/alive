"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  Copy,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
} from "lucide-react"
import { MediaPickerModal } from "@/components/admin/MediaPickerModal"
import { BannerPreview } from "@/components/admin/BannerPreview"
import { fromDateTimeLocalValue, toDateTimeLocalValue, formatDateTime } from "@/lib/datetime"
import {
  ALL_PROMO_SPOTS,
  PROMO_DEVICES,
  PROMO_FORMATS,
  PROMO_FORMAT_LABELS,
  bannerFormats,
  formatLabels,
  hasFormat,
  PROMO_SPOTS,
  promoBannerStatus,
  type PromoBannerStatus,
  type PublicPromoBanner,
} from "@/lib/promo-banners"
import { prepareImageForUpload, measureImage, formatBytes, MAX_UPLOAD_BYTES } from "@/lib/image-compress"
import type {
  PromoBanner,
  PromoBannerArticleScope,
  PromoBannerCategoryScope,
  PromoBannerDevice,
  PromoBannerFormat,
  PromoSpot,
} from "@/types"

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
type Draft = BannerInput & { id?: string }

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif"

const SIZE_HINTS: Record<PromoBannerFormat, { key: string; mobile: string }> = {
  standard: { key: "300×600 — used in the side rails", mobile: "300×250 — used in the page on every screen" },
  prestitial: { key: "Landscape, e.g. 1920×1080", mobile: "Portrait, e.g. 1080×1920" },
  interstitial: { key: "Landscape, e.g. 1920×1080", mobile: "Portrait, e.g. 1080×1920" },
  special_boost: { key: "e.g. 1200×800 or 1080×1080", mobile: "e.g. 1080×1350" },
}

const STATUS_STYLES: Record<PromoBannerStatus, { label: string; className: string; dot: string }> = {
  live: { label: "Live", className: "bg-emerald-500/15 text-emerald-700", dot: "bg-emerald-500" },
  scheduled: { label: "Scheduled", className: "bg-amber-500/15 text-amber-700", dot: "bg-amber-500" },
  expired: { label: "Expired", className: "bg-neutral-500/15 text-neutral-500", dot: "bg-neutral-400" },
  paused: { label: "Paused", className: "bg-sky-500/15 text-sky-700", dot: "bg-sky-500" },
}

/** Outlined secondary buttons: pointer, hover tint, slight press. */
const outlineButton =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] text-[var(--fg-2)] transition-colors duration-150 hover:border-[var(--fg-3)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"

const primaryButton =
  "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#e63946] font-semibold text-white transition-colors duration-150 hover:bg-[#c9303d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--fg-3)] focus:border-[var(--fg-3)]"

function defaultDates() {
  // Starts now, so a new banner is live as soon as it's saved; runs for two weeks.
  const start = new Date()
  start.setSeconds(0, 0)
  const end = new Date(start)
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
    formats: ["standard"],
    ...defaultDates(),
    show_on_home: true,
    category_scope: "all",
    category_ids: [],
    article_scope: "all",
    device: "all",
    placements: [...ALL_PROMO_SPOTS],
    repeat_in_spots: false,
    max_impressions: null,
    max_clicks: null,
    priority: 0,
    weight: 1,
    is_active: true,
  }
}

/** The fields the public site uses — what the preview renders. */
function toPublic(b: Draft): PublicPromoBanner {
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
    format: b.formats[0] ?? b.format,
    formats: b.formats,
    show_on_home: b.show_on_home,
    category_scope: b.category_scope,
    category_ids: b.category_ids,
    article_scope: b.article_scope,
    device: b.device,
    placements: b.placements,
    repeat_in_spots: b.repeat_in_spots,
    priority: b.priority,
    weight: b.weight,
  }
}

function parseCap(value: string) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

const countFormat = new Intl.NumberFormat("el-GR")
const formatCount = (n: number) => countFormat.format(n)
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("el-GR", { day: "numeric", month: "short", timeZone: "Europe/Athens" }).format(new Date(iso))

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

// ─── Small controls ─────────────────────────────────────────

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150 ${
        checked ? "bg-[#e63946]" : "bg-[var(--bg-3)] ring-1 ring-inset ring-[var(--border)]"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  )
}

/** A row of mutually exclusive options. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; disabled?: boolean; title?: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap rounded-lg p-0.5"
      style={{ backgroundColor: "var(--bg-3)" }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? "cursor-default bg-[var(--bg)] text-[var(--fg)] shadow-sm"
                : "cursor-pointer text-[var(--fg-2)] hover:text-[var(--fg)]"
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Toggleable pill, for multi-select lists (categories, placements). */
function Chip({
  on,
  onClick,
  color,
  title,
  children,
}: {
  on: boolean
  onClick: () => void
  color?: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
        on
          ? "text-[var(--fg)]"
          : "border-[var(--border)] text-[var(--fg-2)] hover:border-[var(--fg-3)] hover:text-[var(--fg)]"
      }`}
      style={on ? { borderColor: color ?? "#e63946", backgroundColor: `${color ?? "#e63946"}1f` } : undefined}
    >
      {on ? <Check size={12} /> : color ? <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> : null}
      {children}
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium" style={{ color: "var(--fg-2)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px]" style={{ color: "var(--fg-3)" }}>
          {hint}
        </span>
      )}
    </label>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-b px-5 py-6 sm:px-6" style={{ borderColor: "var(--border)" }}>
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--fg-3)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

/** A labelled line in the "Where it shows" section: name on the left, control on the right. */
function OptionRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p className="text-sm" style={{ color: "var(--fg)" }}>{label}</p>
        {hint && <p className="text-[11px]" style={{ color: "var(--fg-3)" }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
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
  emptyText,
  onChange,
}: {
  label: string
  icon: typeof Monitor
  hint: string
  url: string | null
  width: number | null
  height: number | null
  optional?: boolean
  /** Shown in the empty box of an optional visual */
  emptyText?: string
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
      setSavedNote(
        uploaded.file.size < uploaded.originalBytes
          ? `compressed ${formatBytes(uploaded.originalBytes)} → ${formatBytes(uploaded.file.size)}`
          : formatBytes(uploaded.file.size)
      )
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
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--fg-2)" }}>
          <Icon size={13} />
          {label}
          {optional && <span style={{ color: "var(--fg-3)" }}>· optional</span>}
        </span>
        {optional && url && (
          <button
            type="button"
            onClick={() => {
              setSavedNote(null)
              onChange({ url: null, width: null, height: null })
            }}
            className="cursor-pointer text-[11px] text-[var(--fg-3)] transition-colors hover:text-red-500"
            title="Remove the mobile visual (the key visual is used everywhere)"
          >
            Remove
          </button>
        )}
      </div>

      <div
        className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: "var(--bg-3)", border: "1px dashed var(--border)" }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="px-4 text-center text-xs" style={{ color: "var(--fg-3)" }}>
            {optional ? emptyText ?? "Uses the key visual" : "No visual yet"}
          </p>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
            Uploading…
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className={`${outlineButton} px-2 py-1.5 text-xs font-medium`} title="Upload a JPG, PNG, WebP or GIF">
          <Upload size={12} />
          Upload
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
          className={`${outlineButton} px-2 py-1.5 text-xs font-medium`}
          title="Pick an image already in the media library"
        >
          <ImagePlus size={12} />
          Library
        </button>
      </div>

      <p className="text-[11px] leading-snug" style={{ color: "var(--fg-3)" }}>
        {url && width && height ? `${width}×${height}` : hint}
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

/**
 * Preview button: previews straight away for a single format, otherwise asks which format.
 * `children` is the button's content; the menu opens above or below it.
 */
function PreviewPicker({
  formats,
  onPick,
  className,
  title,
  ariaLabel,
  menuSide = "below",
  children,
}: {
  formats: PromoBannerFormat[]
  onPick: (format: PromoBannerFormat) => void
  className: string
  title?: string
  ariaLabel?: string
  menuSide?: "above" | "below"
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={title}
        aria-label={ariaLabel}
        aria-haspopup={formats.length > 1 ? "menu" : undefined}
        aria-expanded={formats.length > 1 ? open : undefined}
        onClick={(e) => {
          e.stopPropagation()
          if (formats.length === 1) onPick(formats[0])
          else setOpen((v) => !v)
        }}
        className={className}
      >
        {children}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-30 w-48 overflow-hidden rounded-lg py-1 shadow-xl ${
            menuSide === "above" ? "bottom-full left-0 mb-1" : "right-0 top-full mt-1"
          }`}
          style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>
            Preview as
          </p>
          {formats.map((f) => (
            <button
              key={f}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onPick(f)
              }}
              className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-[var(--fg)] transition-colors hover:bg-[var(--bg-3)]"
            >
              {PROMO_FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form (side panel) ──────────────────────────────────────

function BannerForm({
  initial,
  categories,
  onSave,
  onClose,
}: {
  initial: Draft
  categories: CategoryOption[]
  onSave: (data: Draft) => Promise<boolean>
  onClose: () => void
}) {
  const [form, setForm] = useState<Draft>(initial)
  const [startsAt, setStartsAt] = useState(toDateTimeLocalValue(initial.starts_at))
  const [endsAt, setEndsAt] = useState(toDateTimeLocalValue(initial.ends_at))
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState<PromoBannerFormat | null>(null)
  const isEdit = Boolean(initial.id)
  const isStandard = form.formats.includes("standard")
  const hasAdvanced =
    initial.device !== "all" ||
    initial.priority !== 0 ||
    initial.weight !== 1 ||
    initial.max_impressions != null ||
    initial.max_clicks != null
  const formRef = useRef<HTMLFormElement>(null)

  function set<K extends keyof BannerInput>(key: K, value: BannerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleIn<T extends string>(list: T[], value: T) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  }

  // Escape closes the panel (unless a preview is open; it handles Escape itself).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && previewing === null) onClose()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, previewing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.image_url) return void toast.error("Add a key visual")
    let starts_at: string
    let ends_at: string
    try {
      starts_at = fromDateTimeLocalValue(startsAt)
      ends_at = fromDateTimeLocalValue(endsAt)
    } catch {
      return void toast.error("Please set both start and end dates")
    }
    if (new Date(ends_at) <= new Date(starts_at)) return void toast.error("End date must be after the start date")
    if (form.category_scope === "selected" && form.category_ids.length === 0)
      return void toast.error("Pick at least one category")
    if (form.article_scope === "categories" && form.category_scope === "none")
      return void toast.error("“Same categories” for articles needs category pages set to All or Selected")
    if (!form.show_on_home && form.category_scope === "none" && form.article_scope === "none")
      return void toast.error("Choose at least one page where the banner appears")
    if (form.formats.length === 0) return void toast.error("Choose at least one format")
    if (isStandard && form.placements.length === 0) return void toast.error("Choose at least one placement")

    setSaving(true)
    await onSave({ ...form, starts_at, ends_at, destination_url: form.destination_url.trim() })
    setSaving(false)
  }

  // Size hints follow the first chosen format (one set of visuals serves all formats).
  const hints = SIZE_HINTS[form.formats[0] ?? "standard"]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit banner" : "New banner"}
        className="relative flex h-full w-full max-w-[640px] flex-col shadow-2xl"
        style={{ backgroundColor: "var(--bg-2)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>
              {isEdit ? "Edit banner" : "New banner"}
            </h2>
            {isEdit && (
              <p className="text-xs" style={{ color: "var(--fg-3)" }}>{initial.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-[var(--fg-3)] transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--fg)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" hint="Only you see this">
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  maxLength={120}
                  placeholder="e.g. Release Athens 2026"
                  className={inputClass}
                />
              </Field>
              <Field label="Link" hint="https://… opens a new tab; /path stays on Alive">
                <input
                  value={form.destination_url}
                  onChange={(e) => set("destination_url", e.target.value)}
                  required
                  placeholder="https://…"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Formats" description="Choose one or more. The banner runs as each format you tick.">
            <div className="grid gap-2 sm:grid-cols-2">
              {PROMO_FORMATS.map((f) => {
                const on = form.formats.includes(f.value)
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setForm((prev) => ({ ...prev, formats: toggleIn(prev.formats, f.value) }))}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors duration-150 ${
                      on
                        ? "border-[#e63946] bg-[rgba(230,57,70,0.06)]"
                        : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--fg-3)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                        on ? "bg-[#e63946] text-white" : "border border-[var(--border)]"
                      }`}
                    >
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: "var(--fg)" }}>{f.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--fg-3)" }}>
                        {f.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            {form.formats.length > 1 && (
              <p className="text-[11px]" style={{ color: "var(--fg-3)" }}>
                The same visuals are used for every format; full-screen formats scale them to fit the screen.
              </p>
            )}
          </Section>

          <Section title="Visuals">
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
                label={isStandard ? "Small visual" : "Phone visual"}
                icon={Smartphone}
                hint={hints.mobile}
                emptyText={isStandard ? "Not set: the key visual is used everywhere" : "Phones use the key visual"}
                url={form.mobile_image_url}
                width={form.mobile_image_width}
                height={form.mobile_image_height}
                optional
                onChange={({ url, width, height }) =>
                  setForm((prev) => ({ ...prev, mobile_image_url: url, mobile_image_width: width, mobile_image_height: height }))
                }
              />
            </div>
            <Field label="Alt text" hint="Describes the visual for screen readers">
              <input
                value={form.alt_text ?? ""}
                onChange={(e) => set("alt_text", e.target.value || null)}
                maxLength={200}
                placeholder="e.g. Release Athens 2026 poster"
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Where it shows">
            <div className="space-y-4">
              <OptionRow label="Homepage">
                <Switch label="Homepage" checked={form.show_on_home} onChange={(v) => set("show_on_home", v)} />
              </OptionRow>
              <OptionRow label="Category pages">
                <Segmented<PromoBannerCategoryScope>
                  label="Category pages"
                  value={form.category_scope}
                  onChange={(v) => {
                    set("category_scope", v)
                    if (v === "none" && form.article_scope === "categories") set("article_scope", "none")
                  }}
                  options={[
                    { value: "none", label: "None" },
                    { value: "all", label: "All" },
                    { value: "selected", label: "Selected" },
                  ]}
                />
              </OptionRow>
              {form.category_scope === "selected" && (
                <div className="flex flex-wrap gap-2 rounded-lg p-3" style={{ backgroundColor: "var(--bg)" }}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat.id}
                      on={form.category_ids.includes(cat.id)}
                      color={cat.color ?? undefined}
                      onClick={() => setForm((prev) => ({ ...prev, category_ids: toggleIn(prev.category_ids, cat.id) }))}
                    >
                      {cat.name}
                    </Chip>
                  ))}
                </div>
              )}
              <OptionRow label="Article pages">
                <Segmented<PromoBannerArticleScope>
                  label="Article pages"
                  value={form.article_scope}
                  onChange={(v) => set("article_scope", v)}
                  options={[
                    { value: "none", label: "None" },
                    { value: "all", label: "All" },
                    {
                      value: "categories",
                      label: "Same categories",
                      disabled: form.category_scope === "none",
                      title:
                        form.category_scope === "none"
                          ? "Set category pages to All or Selected first"
                          : "Only articles in the categories chosen above",
                    },
                  ]}
                />
              </OptionRow>
            </div>

            {isStandard && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>Placements on the page</p>
                <div className="flex flex-wrap gap-2">
                  {PROMO_SPOTS.map((spot) => (
                    <Chip
                      key={spot.value}
                      on={form.placements.includes(spot.value)}
                      title={spot.hint}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, placements: toggleIn<PromoSpot>(prev.placements, spot.value) }))
                      }
                    >
                      {spot.label}
                    </Chip>
                  ))}
                </div>
                <p className="text-[11px]" style={{ color: "var(--fg-3)" }}>Hover a placement for where it sits.</p>
                <div className="pt-2">
                  <OptionRow
                    label="Show in every chosen placement"
                    hint={
                      (form.repeat_in_spots
                        ? "On: appears once in each placement above, in spots no other banner takes."
                        : "Off: appears once per page, in the first free placement.") +
                      " Applies to the Standard placements only; full-screen formats follow their own rules."
                    }
                  >
                    <Switch
                      label="Show in every chosen placement"
                      checked={form.repeat_in_spots}
                      onChange={(v) => set("repeat_in_spots", v)}
                    />
                  </OptionRow>
                </div>
              </div>
            )}
          </Section>

          <Section title="Schedule">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts (Athens time)">
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Ends (Athens time)">
                <input
                  type="datetime-local"
                  value={endsAt}
                  min={startsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
            </div>
            <OptionRow label="Active" hint="Turn off to pause without changing the dates">
              <Switch label="Active" checked={form.is_active} onChange={(v) => set("is_active", v)} />
            </OptionRow>
          </Section>

          <details className="group" open={hasAdvanced}>
            <summary
              className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold transition-colors hover:bg-[var(--bg-3)] sm:px-6 [&::-webkit-details-marker]:hidden"
              style={{ color: "var(--fg)" }}
            >
              <span>
                Advanced
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--fg-3)" }}>
                  Devices, priority, weight, limits
                </span>
              </span>
              <ChevronDown size={16} className="transition-transform group-open:rotate-180" style={{ color: "var(--fg-3)" }} />
            </summary>
            <div className="space-y-4 px-5 pb-6 sm:px-6">
              <OptionRow label="Devices" hint="Phones are screens under 768px">
                <Segmented<PromoBannerDevice>
                  label="Devices"
                  value={form.device}
                  onChange={(v) => set("device", v)}
                  options={PROMO_DEVICES.map(([value, label]) => ({
                    value,
                    label: value === "all" ? "All" : value === "desktop" ? "Desktop & tablet" : "Phones",
                    title: label,
                  }))}
                />
              </OptionRow>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Priority" hint="Higher always gets the first spots">
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    value={form.priority}
                    onChange={(e) => set("priority", Number.parseInt(e.target.value || "0", 10) || 0)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Weight" hint="Share among equal priority: 2× shows twice as often">
                  <select
                    value={form.weight}
                    onChange={(e) => set("weight", Number(e.target.value))}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        {w}×{w === 1 ? " (normal)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Stop after impressions" hint="Leave empty for no limit">
                  <input
                    type="number"
                    min={1}
                    value={form.max_impressions ?? ""}
                    onChange={(e) => set("max_impressions", parseCap(e.target.value))}
                    placeholder="No limit"
                    className={inputClass}
                  />
                </Field>
                <Field label="Stop after clicks" hint="Leave empty for no limit">
                  <input
                    type="number"
                    min={1}
                    value={form.max_clicks ?? ""}
                    onChange={(e) => set("max_clicks", parseCap(e.target.value))}
                    placeholder="No limit"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-2 border-t px-5 py-3 sm:px-6"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-2)" }}
        >
          <PreviewPicker
            formats={form.formats.length ? form.formats : ["standard"]}
            menuSide="above"
            onPick={(f) => (form.image_url ? setPreviewing(f) : toast.error("Add a key visual to preview"))}
            className={`${outlineButton} px-3 py-2 text-sm`}
            title="See how it looks on the site before saving"
          >
            <Eye size={14} />
            Preview
            {form.formats.length > 1 && <ChevronDown size={13} />}
          </PreviewPicker>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${outlineButton} px-3 py-2 text-sm`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`${primaryButton} px-4 py-2 text-sm`}>
              <Check size={14} />
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create banner"}
            </button>
          </div>
        </div>
      </form>
      {previewing && <BannerPreview banner={toPublic(form)} format={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  )
}

// ─── List ───────────────────────────────────────────────────

/** Icon button with an info box on hover or keyboard focus. */
function ActionButton({
  label,
  hint,
  onClick,
  children,
}: {
  label: string
  hint: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <span className="group/action relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        aria-label={`${label} banner`}
        className="cursor-pointer rounded-md p-2 text-[var(--fg-3)] transition-colors duration-150 hover:bg-[var(--bg-3)] hover:text-[var(--fg)] focus-visible:bg-[var(--bg-3)] focus-visible:text-[var(--fg)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fg-3)]"
      >
        {children}
      </button>
      <span
        role="tooltip"
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[200px] -translate-x-1/2 translate-y-1 rounded-lg px-2.5 py-1.5 text-left opacity-0 shadow-lg transition-all duration-150 group-hover/action:translate-y-0 group-hover/action:opacity-100 group-has-[:focus-visible]/action:translate-y-0 group-has-[:focus-visible]/action:opacity-100"
        style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}
      >
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block text-[11px] opacity-75">{hint}</span>
      </span>
    </span>
  )
}

/** "⋯" menu for the less frequent actions. */
function MoreMenu({ items }: { items: { label: string; icon: typeof Copy; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label="More actions"
        aria-expanded={open}
        title="More actions"
        className="cursor-pointer rounded-md p-2 text-[var(--fg-3)] transition-colors duration-150 hover:bg-[var(--bg-3)] hover:text-[var(--fg)]"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg py-1 shadow-xl"
          style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map(({ label, icon: Icon, onClick, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onClick()
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-3)] ${
                danger ? "text-red-600" : "text-[var(--fg)]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function BannerManager({ initial, categories, totals }: Props) {
  const router = useRouter()
  const [banners, setBanners] = useState(initial)
  // The banner open in the side panel: a new draft, a copy, or an existing banner.
  const [editing, setEditing] = useState<Draft | null>(null)
  const [previewing, setPreviewing] = useState<{ banner: PromoBanner; format: PromoBannerFormat } | null>(null)
  const [filter, setFilter] = useState<PromoBannerStatus | "all">("all")

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  function whereSummary(b: PromoBanner) {
    const parts: string[] = []
    if (b.show_on_home) parts.push("Homepage")
    if (b.category_scope === "all") parts.push("All categories")
    if (b.category_scope === "selected") {
      const names = b.category_ids.map((id) => categoryNames.get(id) ?? "Deleted category")
      parts.push(names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", "))
    }
    if (b.article_scope !== "none") parts.push("Articles")
    if (b.device === "desktop") parts.push("Desktop only")
    if (b.device === "mobile") parts.push("Phones only")
    if (hasFormat(b, "standard") && b.placements.length < ALL_PROMO_SPOTS.length) {
      parts.push(
        b.placements
          .map((p) => PROMO_SPOTS.find((s) => s.value === p)?.label)
          .filter(Boolean)
          .join(", ")
      )
    }
    if (hasFormat(b, "standard") && b.repeat_in_spots) parts.push("Every chosen placement")
    return parts.join(" · ") || "Nowhere"
  }

  async function save(data: Draft) {
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
    setBanners((prev) => (id ? prev.map((b) => (b.id === id ? json : b)) : [json, ...prev]))
    setEditing(null)
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
    if (!res.ok) return void toast.error(json.error ?? "Failed to update banner")
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? json : b)))
    toast.success(json.is_active ? "Banner resumed" : "Banner paused")
  }

  async function handleDelete(banner: PromoBanner) {
    if (!confirm(`Delete banner "${banner.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return void toast.error(json.error ?? "Failed to delete banner")
    }
    setBanners((prev) => prev.filter((b) => b.id !== banner.id))
    toast.success("Banner deleted")
    router.refresh()
  }

  function duplicate(banner: PromoBanner) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...copy } = banner
    // Copies start paused so a campaign never runs twice by accident.
    setEditing({ ...copy, name: `${banner.name} (copy)`.slice(0, 120), is_active: false })
  }

  const withStatus = banners.map((b) => ({ banner: b, status: promoBannerStatus(b) }))
  const visible = filter === "all" ? withStatus : withStatus.filter((b) => b.status === filter)
  const counts = (s: PromoBannerStatus) => withStatus.filter((b) => b.status === s).length

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<PromoBannerStatus | "all">
          label="Filter banners"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All ${banners.length}` },
            { value: "live", label: `Live ${counts("live")}` },
            { value: "scheduled", label: `Scheduled ${counts("scheduled")}` },
            { value: "paused", label: `Paused ${counts("paused")}` },
            { value: "expired", label: `Expired ${counts("expired")}` },
          ]}
        />
        <button onClick={() => setEditing(emptyBanner())} className={`${primaryButton} px-4 py-2 text-sm`}>
          <Plus size={15} />
          New banner
        </button>
      </div>

      <div className="rounded-xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
        {visible.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
              {banners.length === 0 ? "No banners yet" : "No banners match this filter"}
            </p>
            {banners.length === 0 && (
              <p className="mt-1 text-xs" style={{ color: "var(--fg-3)" }}>
                Create one to start showing promotions on the site.
              </p>
            )}
          </div>
        )}
        {visible.map(({ banner, status }, i) => {
          const t = totals[banner.id] ?? { impressions: 0, clicks: 0 }
          const ctr = t.impressions > 0 ? `${((t.clicks / t.impressions) * 100).toFixed(2)}%` : "—"
          return (
            <div
              key={banner.id}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(banner)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(banner)
              }}
              className={`grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-3)]/50 sm:grid-cols-[72px_minmax(0,1fr)_200px_auto] ${
                i > 0 ? "border-t border-[var(--border)]" : ""
              } first:rounded-t-xl last:rounded-b-xl`}
            >
              <div className="flex h-12 items-center justify-center overflow-hidden rounded-md" style={{ backgroundColor: "var(--bg-3)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.image_url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>{banner.name}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status].className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                    {STATUS_STYLES[status].label}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>{formatLabels(banner)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs" style={{ color: "var(--fg-3)" }} title={`${formatDateTime(banner.starts_at)} → ${formatDateTime(banner.ends_at)}`}>
                  {shortDate(banner.starts_at)} → {shortDate(banner.ends_at)} · {whereSummary(banner)}
                </p>
              </div>

              <div className="hidden grid-cols-3 gap-2 text-right sm:grid">
                {[
                  ["Views", formatCount(t.impressions)],
                  ["Clicks", formatCount(t.clicks)],
                  ["CTR", ctr],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--fg)" }}>{value}</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center">
                <span className="group/action relative inline-flex">
                  <PreviewPicker
                    formats={bannerFormats(banner)}
                    onPick={(format) => setPreviewing({ banner, format })}
                    ariaLabel="Preview banner"
                    title="Preview: see how it looks on the site"
                    className="cursor-pointer rounded-md p-2 text-[var(--fg-3)] transition-colors duration-150 hover:bg-[var(--bg-3)] hover:text-[var(--fg)]"
                  >
                    <Eye size={16} />
                  </PreviewPicker>
                </span>
                <ActionButton label="Edit" hint="Visuals, dates and where it shows" onClick={() => setEditing(banner)}>
                  <Pencil size={16} />
                </ActionButton>
                <MoreMenu
                  items={[
                    { label: "Duplicate", icon: Copy, onClick: () => duplicate(banner) },
                    {
                      label: banner.is_active ? "Pause" : "Resume",
                      icon: banner.is_active ? Pause : Play,
                      onClick: () => toggleActive(banner),
                    },
                    {
                      label: "Open link",
                      icon: ExternalLink,
                      onClick: () => window.open(banner.destination_url, "_blank", "noopener,noreferrer"),
                    },
                    { label: "Delete", icon: Trash2, onClick: () => handleDelete(banner), danger: true },
                  ]}
                />
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <BannerForm
          key={editing.id ?? "new"}
          initial={editing}
          categories={categories}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {previewing && (
        <BannerPreview banner={toPublic(previewing.banner)} format={previewing.format} onClose={() => setPreviewing(null)} />
      )}
    </div>
  )
}
