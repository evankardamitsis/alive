"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react"

interface Author {
  id: string
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  email: string
  role: "admin" | "editor" | "contributor"
  social_links: Record<string, string>
  created_at: string
}

const ROLES = ["admin", "editor", "contributor"] as const

const ROLE_STYLES: Record<string, string> = {
  admin:       "bg-red-500/15 text-red-600",
  editor:      "bg-blue-500/15 text-blue-600",
  contributor: "bg-neutral-500/15 text-neutral-500",
}

const SOCIAL_KEYS = ["twitter", "instagram", "website"] as const

function initForm(a?: Partial<Author>) {
  return {
    name: a?.name ?? "",
    email: a?.email ?? "",
    slug: a?.slug ?? "",
    bio: a?.bio ?? "",
    avatar_url: a?.avatar_url ?? "",
    role: (a?.role ?? "contributor") as Author["role"],
    social_links: {
      twitter: a?.social_links?.twitter ?? "",
      instagram: a?.social_links?.instagram ?? "",
      website: a?.social_links?.website ?? "",
    },
  }
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function AuthorManager({ initial }: { initial: Author[] }) {
  const [authors, setAuthors] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(initForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setCreating(true)
    setEditingId(null)
    setForm(initForm())
    setError(null)
  }

  function openEdit(a: Author) {
    setEditingId(a.id)
    setCreating(false)
    setExpandedId(a.id)
    setForm(initForm(a))
    setError(null)
  }

  function cancelForm() {
    setCreating(false)
    setEditingId(null)
    setError(null)
  }

  function setField<K extends keyof ReturnType<typeof initForm>>(k: K, v: ReturnType<typeof initForm>[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    if (k === "name" && !editingId) {
      setForm((f) => ({ ...f, name: v as string, slug: slugify(v as string) }))
    }
  }

  function setSocial(k: string, v: string) {
    setForm((f) => ({ ...f, social_links: { ...f.social_links, [k]: v } }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      slug: form.slug.trim() || slugify(form.name),
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      role: form.role,
      social_links: Object.fromEntries(
        Object.entries(form.social_links).filter(([, v]) => v.trim())
      ),
    }

    const url = editingId ? `/api/admin/authors/${editingId}` : "/api/admin/authors"
    const method = editingId ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) { setError(json.error ?? "Failed to save"); return }

    if (editingId) {
      setAuthors((prev) => prev.map((a) => (a.id === editingId ? json : a)))
    } else {
      setAuthors((prev) => [...prev, json].sort((a, b) => a.name.localeCompare(b.name)))
    }
    cancelForm()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this author? This will fail if they have posts assigned.")) return
    const res = await fetch(`/api/admin/authors/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? "Failed to delete")
      return
    }
    setAuthors((prev) => prev.filter((a) => a.id !== id))
  }

  const FormPanel = (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
        {editingId ? "Edit author" : "New author"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name *">
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Full name"
            className="field-input"
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="author@example.com"
            className="field-input"
          />
        </Field>
        <Field label="Slug">
          <input
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
            placeholder="auto-generated"
            className="field-input"
          />
        </Field>
        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) => setField("role", e.target.value as Author["role"])}
            className="field-input"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Avatar URL" className="sm:col-span-2">
          <input
            value={form.avatar_url}
            onChange={(e) => setField("avatar_url", e.target.value)}
            placeholder="https://…"
            className="field-input"
          />
        </Field>
        <Field label="Bio" className="sm:col-span-2">
          <textarea
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            rows={3}
            placeholder="Short bio…"
            className="field-input resize-none"
          />
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--fg-3)" }}>Social links</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SOCIAL_KEYS.map((k) => (
            <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
              <input
                value={form.social_links[k]}
                onChange={(e) => setSocial(k, e.target.value)}
                placeholder={k === "website" ? "https://…" : `@handle`}
                className="field-input"
              />
            </Field>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={cancelForm}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
        >
          <X size={13} /> Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !form.name.trim() || !form.email.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors disabled:opacity-40"
        >
          <Check size={13} /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.5rem;
          padding: 0.4rem 0.625rem;
          font-size: 0.875rem;
          outline: none;
          background-color: var(--bg-3);
          border: 1px solid var(--border);
          color: var(--fg);
        }
      `}</style>

      {/* Add button */}
      {!creating && !editingId && (
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors"
        >
          <Plus size={14} /> New Author
        </button>
      )}

      {/* Create form */}
      {creating && FormPanel}

      {/* Authors list */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {authors.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: "var(--fg-3)" }}>No authors yet.</p>
        )}
        {authors.map((author, i) => (
          <div key={author.id}>
            {editingId === author.id ? (
              <div className="p-4">{FormPanel}</div>
            ) : (
              <div
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                  backgroundColor: "var(--bg)",
                }}
              >
                {/* Avatar */}
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt={author.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                    style={{ backgroundColor: "#e63946" }}
                  >
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm" style={{ color: "var(--fg)" }}>{author.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_STYLES[author.role]}`}>
                      {author.role}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--fg-3)" }}>{author.email}</p>
                </div>

                {/* Expand/collapse bio */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === author.id ? null : author.id)}
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--fg-3)", border: "1px solid var(--border)" }}
                >
                  {expandedId === author.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => openEdit(author)}
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(author.id)}
                  className="p-1.5 rounded-lg text-red-500"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            {/* Expanded details */}
            {expandedId === author.id && editingId !== author.id && (
              <div
                className="px-5 pb-4 space-y-1 text-xs"
                style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-2)", color: "var(--fg-2)" }}
              >
                {author.bio && <p className="pt-3 leading-relaxed">{author.bio}</p>}
                <p className="pt-2">
                  <span style={{ color: "var(--fg-3)" }}>Slug: </span>{author.slug}
                </p>
                {Object.entries(author.social_links ?? {}).filter(([, v]) => v).map(([k, v]) => (
                  <p key={k}>
                    <span style={{ color: "var(--fg-3)" }}>{k}: </span>
                    <a href={k === "website" ? v : `https://${k}.com/${v.replace("@", "")}`} target="_blank" rel="noreferrer" className="underline">{v}</a>
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--fg-3)" }}>{authors.length} author{authors.length !== 1 ? "s" : ""}</p>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="text-xs" style={{ color: "var(--fg-2)" }}>{label}</label>
      {children}
    </div>
  )
}
