"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  color: string | null
  description: string | null
}

interface Props {
  initial: Category[]
}

const PRESET_COLORS = [
  "#a8dadc", "#e9c46a", "#f4a261", "#2a9d8f", "#e63946", "#c77dff",
  "#06d6a0", "#ef476f", "#ffd166", "#118ab2",
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-")
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Category>
  onSave: (data: Omit<Category, "id"> & { id?: string }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [description, setDescription] = useState(initial?.description ?? "")
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ id: initial?.id, name, slug, color, description: description || null })
    setSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-4 space-y-3"
      style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugManual) setSlug(slugify(e.target.value))
            }}
            required
            placeholder="Culture"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-3)" }}>Slug</label>
          <input
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(e.target.value) }}
            required
            placeholder="culture"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs" style={{ color: "var(--fg-3)" }}>Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--fg)" }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs" style={{ color: "var(--fg-3)" }}>Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={12} className="text-black" />}
            </button>
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
            title="Custom color"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors disabled:opacity-50"
        >
          <Check size={13} />
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    </form>
  )
}

export function CategoryManager({ initial }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleCreate(data: Omit<Category, "id"> & { id?: string }) {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const created = await res.json()
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setCreating(false)
      router.refresh()
    }
  }

  async function handleUpdate(data: Omit<Category, "id"> & { id?: string }) {
    const res = await fetch(`/api/admin/categories/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditingId(null)
      router.refresh()
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Posts in this category will lose their category.`)) return
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
    setCategories((prev) => prev.filter((c) => c.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* List */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {categories.length === 0 && !creating && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--fg-3)" }}>No categories yet.</p>
        )}
        {categories.map((cat) =>
          editingId === cat.id ? (
            <div key={cat.id} className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <CategoryForm initial={cat} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
            </div>
          ) : (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 group"
              style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#e63946" }}
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm" style={{ color: "var(--fg)" }}>{cat.name}</span>
                <span className="ml-2 text-xs" style={{ color: "var(--fg-3)" }}>/{cat.slug}</span>
                {cat.description && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--fg-3)" }}>{cat.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingId(cat.id)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: "var(--fg-3)" }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 rounded-md hover:text-red-400 transition-colors"
                  style={{ color: "var(--fg-3)" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {creating ? (
        <CategoryForm onSave={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors"
        >
          <Plus size={14} />
          New Category
        </button>
      )}
    </div>
  )
}
