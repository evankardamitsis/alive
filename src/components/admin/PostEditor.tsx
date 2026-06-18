"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Link2, Image as ImageIcon, Quote, Code, Undo, Redo, Save, Eye
} from "lucide-react"
import NextLink from "next/link"

interface Category {
  id: string
  name: string
  color: string | null
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
  category_id: string
  published_at: string | null
  read_time: number
}

interface Props {
  categories: Category[]
  initial?: Partial<PostData>
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
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

export function PostEditor({ categories, initial }: Props) {
  const router = useRouter()
  const isNew = !initial?.id

  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "")
  const [coverAlt, setCoverAlt] = useState(initial?.cover_image_alt ?? "")
  const [status, setStatus] = useState<PostData["status"]>(initial?.status ?? "draft")
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "")
  const [publishedAt, setPublishedAt] = useState(
    initial?.published_at ? initial.published_at.slice(0, 16) : ""
  )
  const [readTime, setReadTime] = useState(initial?.read_time ?? 3)
  const [saving, setSaving] = useState(false)
  const [slugManual, setSlugManual] = useState(!!initial?.slug)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
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
    if (!slugManual) setSlug(slugify(val))
  }, [slugManual])

  const addLink = useCallback(() => {
    const url = prompt("URL:")
    if (!url || !editor) return
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    const url = prompt("Image URL:")
    if (!url || !editor) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editor) return
    setSaving(true)

    const body = {
      title,
      slug,
      excerpt,
      content: editor.getHTML(),
      cover_image_url: coverUrl || null,
      cover_image_alt: coverAlt || null,
      status,
      featured,
      category_id: categoryId || null,
      published_at: status === "published" && !publishedAt
        ? new Date().toISOString()
        : publishedAt ? new Date(publishedAt).toISOString() : null,
      read_time: readTime,
    }

    const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${initial!.id}`
    const method = isNew ? "POST" : "PATCH"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setSaving(false)

    if (res.ok && isNew) {
      const data = await res.json()
      router.replace(`/admin/posts/${data.id}`)
      router.refresh()
    } else {
      router.refresh()
    }
  }

  if (!editor) return null

  return (
    <form onSubmit={handleSave}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <NextLink
            href="/admin/posts"
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
          >
            ← Posts
          </NextLink>
          <h1 className="text-xl font-bold text-white">{isNew ? "New Post" : "Edit Post"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && initial?.slug && (
            <NextLink
              href={`/${categories.find(c => c.id === categoryId)?.name?.toLowerCase() ?? ""}/${initial.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
            >
              <Eye size={14} />
              Preview
            </NextLink>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#e63946] hover:bg-[#c9303d] text-white transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save"}
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
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0" style={{ color: "var(--fg-3)" }}>slug /</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
              placeholder="auto-generated"
              className="text-xs bg-transparent outline-none flex-1"
              style={{ color: "var(--fg-2)" }}
            />
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
            <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
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

            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--fg-2)" }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostData["status"])}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {(status === "published" || status === "scheduled") && (
              <div className="space-y-1">
                <label className="text-xs" style={{ color: "var(--fg-2)" }}>Publish date</label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm" style={{ color: "var(--fg-2)" }}>Featured post</span>
            </label>
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
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Cover Image</h3>
            {coverUrl && (
              <img src={coverUrl} alt={coverAlt} className="w-full aspect-video object-cover rounded-lg" />
            )}
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--fg-2)" }}>URL</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
              />
            </div>
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
  )
}
