"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { ResizableImageExtension } from "@/components/admin/ResizableImage"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Link2, Image as ImageIcon, Quote, Code, Undo, Redo, Save, Eye, Upload, X, Send, Clock
} from "lucide-react"
import NextLink from "next/link"
import { MediaPickerModal } from "@/components/admin/MediaPickerModal"
import { EditorLinkDialog } from "@/components/admin/EditorLinkDialog"
import { toSlug } from "@/lib/slugify"
import {
  formatDateTime,
  fromDateTimeLocalValue,
  isFutureInSiteTimezone,
  nowIso,
  toDateTimeLocalValue,
} from "@/lib/datetime"

interface Category {
  id: string
  name: string
  color: string | null
  featuredPostId?: string | null
}

interface PostData {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string
  cover_image_alt: string
  status: "draft" | "published" | "scheduled" | "archived"
  featured: boolean
  is_hero: boolean
  category_id: string
  published_at: string | null
  scheduled_at?: string | null
  read_time: number
}

interface Props {
  categories: Category[]
  initial?: Partial<PostData>
  currentHeroId?: string | null
}

type SaveAction = "save" | "publish" | "schedule"

type SubmitOptions = {
  status?: PostData["status"]
}

const STATUS_LABELS: Record<PostData["status"], string> = {
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
  archived: "Archived",
}

const STATUS_STYLES: Record<PostData["status"], string> = {
  draft: "bg-neutral-500/15 text-neutral-500",
  published: "bg-emerald-500/15 text-emerald-600",
  scheduled: "bg-amber-500/15 text-amber-600",
  archived: "bg-red-500/15 text-red-500",
}

function ToolbarButton({
  onClick, active, title, children
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className="p-1.5 rounded transition-colors"
      style={{
        color: active ? "#fff" : "var(--fg-2)",
        backgroundColor: active ? "#e63946" : "transparent",
      }}
    >
      {children}
    </button>
  )
}

export function PostEditor({ categories, initial, currentHeroId }: Props) {
  const router = useRouter()
  const isNew = !initial?.id

  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "")
  const [coverAlt, setCoverAlt] = useState(initial?.cover_image_alt ?? "")
  const [status, setStatus] = useState<PostData["status"]>(initial?.status ?? "draft")
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [isHero, setIsHero] = useState(initial?.is_hero ?? false)
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "")
  const [publishedAt, setPublishedAt] = useState(
    initial?.published_at ? toDateTimeLocalValue(initial.published_at) : ""
  )
  const [scheduleEnabled, setScheduleEnabled] = useState(initial?.status === "scheduled")
  const [scheduleAt, setScheduleAt] = useState(
    initial?.scheduled_at
      ? toDateTimeLocalValue(initial.scheduled_at)
      : initial?.status === "scheduled" && initial?.published_at
        ? toDateTimeLocalValue(initial.published_at)
        : ""
  )
  const [readTime, setReadTime] = useState(initial?.read_time ?? 3)
  const [busy, setBusy] = useState<SaveAction | null>(null)
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [mediaPicker, setMediaPicker] = useState(false)
  const [editorImagePicker, setEditorImagePicker] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkInitialUrl, setLinkInitialUrl] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImageExtension,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({ placeholder: "Write your article here…" }),
    ],
    content: initial?.content ?? "",
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-[400px] text-[var(--fg)]",
      },
    },
  })

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val)
    if (!slugManual) setSlug(toSlug(val))
  }, [slugManual])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const current = editor.getAttributes("link").href as string | undefined
    setLinkInitialUrl(current ?? "")
    setLinkDialogOpen(true)
  }, [editor])

  const applyLink = useCallback((url: string, text?: string) => {
    if (!editor) return
    if (editor.state.selection.empty) {
      const label = text || url
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`)
        .run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
        .run()
    }
  }, [editor])

  const removeLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run()
  }, [editor])

  const addImage = useCallback(() => {
    setEditorImagePicker(true)
  }, [])

  async function submitPost(action: SaveAction, options?: SubmitOptions) {
    if (!editor) return
    if (!categoryId) {
      toast.error("Choose a category before saving.")
      return
    }
    if (!title.trim()) {
      toast.error("Add a title before saving.")
      return
    }
    if (action === "schedule") {
      if (!scheduleAt) {
        toast.error("Pick a date and time to schedule.")
        return
      }
      if (!isFutureInSiteTimezone(scheduleAt)) {
        toast.error("Scheduled time must be in the future.")
        return
      }
    }

    setBusy(action)

    const resolvedSlug = slug.trim() ? toSlug(slug) || toSlug(title) : toSlug(title)
    let nextStatus: PostData["status"] = options?.status ?? status
    let nextPublishedAt: string | null = null
    let nextScheduledAt: string | null = null

    if (action === "publish") {
      nextStatus = "published"
      nextPublishedAt = nowIso()
      nextScheduledAt = null
    } else if (action === "schedule") {
      nextStatus = "scheduled"
      nextScheduledAt = fromDateTimeLocalValue(scheduleAt)
      nextPublishedAt = null
    } else {
      if (options?.status) {
        nextStatus = options.status
      } else if (!initial?.id) {
        nextStatus = "draft"
      }

      if (nextStatus === "draft") {
        nextPublishedAt = null
        nextScheduledAt = null
      } else if (nextStatus === "published") {
        nextPublishedAt = publishedAt
          ? fromDateTimeLocalValue(publishedAt)
          : initial?.published_at ?? nowIso()
        nextScheduledAt = null
      } else if (nextStatus === "scheduled") {
        nextScheduledAt = scheduleAt ? fromDateTimeLocalValue(scheduleAt) : null
        nextPublishedAt = null
      }
    }

    const body = {
      title: title.trim(),
      slug: resolvedSlug,
      excerpt,
      content: editor.getHTML(),
      cover_image_url: coverUrl || null,
      cover_image_alt: coverAlt || null,
      status: nextStatus,
      featured,
      is_hero: isHero,
      category_id: categoryId,
      published_at: nextPublishedAt,
      scheduled_at: nextScheduledAt,
      read_time_minutes: readTime,
    }

    const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${initial!.id}`
    const method = isNew ? "POST" : "PATCH"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setBusy(null)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to save post.")
      return
    }

    const data = await res.json()
    setStatus(data.status)
    if (data.status === "published") {
      setPublishedAt(data.published_at ? toDateTimeLocalValue(data.published_at) : "")
      setScheduleEnabled(false)
      setScheduleAt("")
    } else if (data.status === "scheduled") {
      setScheduleEnabled(true)
      setScheduleAt(data.scheduled_at ? toDateTimeLocalValue(data.scheduled_at) : scheduleAt)
    } else if (data.status === "draft") {
      setScheduleEnabled(false)
    }

    if (action === "publish") {
      toast.success(status === "published" ? "Post updated and live" : "Post published")
    } else if (action === "schedule") {
      toast.success("Post scheduled")
    } else if (options?.status === "draft") {
      toast.success("Moved to draft")
    } else if (status === "published") {
      toast.success("Post updated")
    } else {
      toast.success("Draft saved")
    }

    if (isNew) {
      router.replace(`/admin/posts/${data.id}`)
    }
    router.refresh()
  }

  const isBusy = busy !== null
  const saveLabel = status === "published" ? "Update" : "Save draft"

  if (!editor) return null

  return (
    <>
    <MediaPickerModal
      open={mediaPicker}
      onClose={() => setMediaPicker(false)}
      onSelect={(url) => setCoverUrl(url)}
    />
    <MediaPickerModal
      open={editorImagePicker}
      onClose={() => setEditorImagePicker(false)}
      onSelect={(url) => {
        editor?.chain().focus().setImage({ src: url }).run()
      }}
    />
    <EditorLinkDialog
      open={linkDialogOpen}
      initialUrl={linkInitialUrl}
      hasSelection={!!editor && !editor.state.selection.empty}
      onClose={() => setLinkDialogOpen(false)}
      onSubmit={applyLink}
      onRemove={linkInitialUrl ? removeLink : undefined}
    />
    <form onSubmit={(e) => e.preventDefault()}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <NextLink
            href="/admin/posts"
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
          >
            ← Posts
          </NextLink>
          <h1 className="text-xl font-bold" style={{ color: "var(--fg)" }}>{isNew ? "New Post" : "Edit Post"}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isNew && (
            <NextLink
              href={`/admin/posts/${initial!.id}/preview`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
            >
              <Eye size={14} />
              Preview
            </NextLink>
          )}
          <button
            type="button"
            onClick={() => submitPost("save")}
            disabled={isBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ color: "var(--fg)", border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
          >
            <Save size={14} />
            {busy === "save" ? "Saving…" : saveLabel}
          </button>
          <button
            type="button"
            onClick={() => submitPost("publish")}
            disabled={isBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#e63946] hover:bg-[#c9303d] text-white transition-colors disabled:opacity-50"
          >
            <Send size={14} />
            {busy === "publish" ? "Publishing…" : status === "published" ? "Update & publish" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title"
            required
            className="w-full text-3xl font-bold bg-transparent outline-none placeholder:text-neutral-700"
            style={{ color: "var(--fg)" }}
          />

          {/* Slug */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: "var(--fg-3)" }}>slug /</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
              placeholder="auto-generated from title"
              className="text-xs bg-transparent outline-none flex-1 min-w-[12rem]"
              style={{ color: "var(--fg-2)" }}
            />
            {slugManual && (
              <button
                type="button"
                onClick={() => { setSlugManual(false); setSlug(toSlug(title)) }}
                className="text-[11px] underline"
                style={{ color: "var(--fg-3)" }}
              >
                Regenerate from title
              </button>
            )}
          </div>

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short excerpt (used in cards and SEO)…"
            rows={2}
            className="w-full bg-transparent outline-none resize-none text-sm"
            style={{ color: "var(--fg-2)" }}
          />

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* Tiptap Toolbar */}
          <div
            className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-xl sticky top-20 z-10"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
              <Heading2 size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
              <Heading3 size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
              <List size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
              <ListOrdered size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
              <Quote size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code">
              <Code size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={openLinkDialog} active={editor.isActive("link")} title="Link">
              <Link2 size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={addImage} title="Image">
              <ImageIcon size={15} />
            </ToolbarButton>
            <div className="flex-1" />
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
              <Undo size={15} />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
              <Redo size={15} />
            </ToolbarButton>
          </div>

          {/* Editor */}
          <div
            className="rounded-xl p-5 min-h-[500px]"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish panel */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Publish</h3>

            <p className="text-xs leading-relaxed" style={{ color: "var(--fg-3)" }}>
              Use <strong style={{ color: "var(--fg-2)" }}>Publish</strong> to go live immediately.
              Save as draft anytime without publishing.
            </p>

            {status === "published" && publishedAt && (
              <p className="text-xs" style={{ color: "var(--fg-2)" }}>
                Live since {formatDateTime(fromDateTimeLocalValue(publishedAt))}
              </p>
            )}

            <div className="pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "var(--fg-2)" }}>Schedule for later</span>
              </label>

              {scheduleEnabled && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs" style={{ color: "var(--fg-2)" }}>
                      Publish on <span style={{ color: "var(--fg-3)" }}>(Athens)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => submitPost("schedule")}
                    disabled={isBusy}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{ color: "var(--fg)", border: "1px solid var(--border)", backgroundColor: "var(--bg-3)" }}
                  >
                    <Clock size={14} />
                    {busy === "schedule" ? "Scheduling…" : "Schedule post"}
                  </button>
                </>
              )}
            </div>

            {(status === "published" || status === "scheduled") && (
              <button
                type="button"
                onClick={() => submitPost("save", { status: "draft" })}
                disabled={isBusy}
                className="text-xs underline disabled:opacity-50"
                style={{ color: "var(--fg-3)" }}
              >
                Move to draft
              </button>
            )}

            {/* Featured */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "var(--fg-2)" }}>Featured in category</span>
              </label>
              {featured && categoryId && (() => {
                const cat = categories.find((c) => c.id === categoryId)
                const conflict = cat?.featuredPostId && cat.featuredPostId !== initial?.id
                return conflict ? (
                  <p className="mt-1 ml-6 text-[11px] text-amber-600">
                    Saving will replace the current featured post for {cat?.name}.
                  </p>
                ) : null
              })()}
            </div>

            {/* Hero */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHero}
                  onChange={(e) => setIsHero(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "var(--fg-2)" }}>Homepage hero</span>
              </label>
              {isHero && currentHeroId && currentHeroId !== initial?.id && (
                <p className="mt-1 ml-6 text-[11px] text-violet-600">
                  Saving will replace the current hero post.
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Category</h3>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={categoryId === cat.id}
                    onChange={() => setCategoryId(cat.id)}
                  />
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color ?? "#e63946" }}
                  />
                  <span className="text-sm" style={{ color: "var(--fg)" }}>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Cover Image</h3>
              <button
                type="button"
                onClick={() => setMediaPicker(true)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
                style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
              >
                <Upload size={11} />
                Choose
              </button>
            </div>

            {coverUrl ? (
              <div className="relative group rounded-lg overflow-hidden">
                <img src={coverUrl} alt={coverAlt} className="w-full aspect-video object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverUrl(""); setCoverAlt("") }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMediaPicker(true)}
                className="w-full aspect-video rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
                style={{ border: "2px dashed var(--border)", color: "var(--fg-3)" }}
              >
                <ImageIcon size={20} />
                <span className="text-xs">Click to choose</span>
              </button>
            )}

            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--fg-2)" }}>Alt text</label>
              <input
                type="text"
                value={coverAlt}
                onChange={(e) => setCoverAlt(e.target.value)}
                placeholder="Describe the image"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--fg-2)" }}>Or paste URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
            </div>
          </div>

          {/* Read time */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Read time</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value))}
                className="w-16 rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
              <span className="text-sm" style={{ color: "var(--fg-2)" }}>min read</span>
            </div>
          </div>
        </div>
      </div>
    </form>
    </>
  )
}
