"use client"

import Link from "next/link"
import { useState, useMemo, useCallback, useRef } from "react"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Star, Home, ChevronLeft, ChevronRight, X } from "lucide-react"
import { DeletePostButton } from "@/components/admin/DeletePostButton"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Post {
  id: string
  title: string
  slug: string
  status: string
  featured: boolean
  is_hero: boolean
  category_id: string | null
  published_at: string | null
  updated_at: string
  category: { name: string; color: string | null } | null
}

interface Props {
  posts: Post[]
  page: number
  totalPages: number
  total: number
  featuredMap: Record<string, string>
  heroId: string | null
  searchQuery: string
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-600",
  draft:     "bg-neutral-500/15 text-neutral-500",
  scheduled: "bg-amber-500/15 text-amber-600",
  archived:  "bg-red-500/15 text-red-500",
}

type SortKey = "title" | "status" | "published_at" | "updated_at"
type SortDir = "asc" | "desc"

function IconToggle({
  active, activeColor, title, icon: Icon, onClick, busy,
}: {
  active: boolean; activeColor: string; title: string
  icon: React.ElementType; onClick: () => void; busy: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={title}
      className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
      style={{
        backgroundColor: active ? `${activeColor}20` : "transparent",
        color: active ? activeColor : "var(--fg-3)",
        border: `1px solid ${active ? activeColor : "var(--border)"}`,
      }}
    >
      <Icon size={13} />
    </button>
  )
}

export function PostsTable({ posts: initialPosts, page, totalPages, total, featuredMap: initialFeaturedMap, heroId: initialHeroId, searchQuery }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [featuredMap, setFeaturedMap] = useState(initialFeaturedMap)
  const [heroId, setHeroId] = useState(initialHeroId)
  const [sortKey, setSortKey] = useState<SortKey>("updated_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [busy, setBusy] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const toggleField = useCallback(async (post: Post, field: "featured" | "is_hero") => {
    const newVal = field === "featured" ? !post.featured : !post.is_hero
    setBusy(`${post.id}-${field}`)
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        field === "featured"
          ? { featured: newVal, category_id: post.category_id }
          : { is_hero: newVal }
      ),
    })
    setBusy(null)
    if (!res.ok) return

    if (field === "featured") {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id) return { ...p, featured: newVal }
          if (newVal && p.category_id === post.category_id) return { ...p, featured: false }
          return p
        })
      )
      setFeaturedMap((prev) => {
        const next = { ...prev }
        if (newVal && post.category_id) {
          next[post.category_id] = post.id
        } else if (!newVal && post.category_id && prev[post.category_id] === post.id) {
          delete next[post.category_id]
        }
        return next
      })
    } else {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_hero: newVal } : { ...p, is_hero: false }))
      )
      setHeroId(newVal ? post.id : null)
    }
    router.refresh()
  }, [router])

  const filtered = useMemo(() => {
    return posts
      .slice()
      .sort((a, b) => {
        let va = "", vb = ""
        if (sortKey === "title") { va = a.title; vb = b.title }
        else if (sortKey === "status") { va = a.status; vb = b.status }
        else if (sortKey === "published_at") { va = a.published_at ?? ""; vb = b.published_at ?? "" }
        else if (sortKey === "updated_at") { va = a.updated_at; vb = b.updated_at }
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
      })
  }, [posts, sortKey, sortDir])

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={11} className="ml-1 opacity-40 inline" />
    return sortDir === "asc"
      ? <ArrowUp size={11} className="ml-1 inline" style={{ color: "#e63946" }} />
      : <ArrowDown size={11} className="ml-1 inline" style={{ color: "#e63946" }} />
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const q = searchRef.current?.value.trim() ?? ""
          router.push(q ? `/admin/posts?q=${encodeURIComponent(q)}` : "/admin/posts")
        }}
        className="relative"
      >
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--fg-3)" }} />
        <input
          ref={searchRef}
          type="search"
          defaultValue={searchQuery}
          placeholder="Search all posts…"
          className="w-full rounded-lg pl-9 pr-10 py-2 text-sm outline-none"
          style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              if (searchRef.current) searchRef.current.value = ""
              router.push("/admin/posts")
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--fg-3)" }}
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--fg-3)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(217,119,6,0.2)", border: "1px solid #d97706" }} />
          Featured in category
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(124,58,237,0.15)", border: "1px solid #7c3aed" }} />
          Homepage hero
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
              <th className="px-5 py-3 text-left">
                <button onClick={() => toggleSort("title")} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>
                  Title <SortIcon col="title" />
                </button>
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Category</th>
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("status")} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>
                  Status <SortIcon col="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                <button onClick={() => toggleSort("published_at")} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>
                  Published <SortIcon col="published_at" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => {
              const isFeatured = post.featured
              const isHero = post.id === heroId || post.is_hero

              let rowStyle: React.CSSProperties = {
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
              }
              let accentColor = ""
              if (isHero) accentColor = "#7c3aed"
              else if (isFeatured) accentColor = "#d97706"

              return (
                <tr
                  key={post.id}
                  className="group transition-colors"
                  style={{
                    ...rowStyle,
                    backgroundColor: isHero
                      ? "rgba(124,58,237,0.05)"
                      : isFeatured
                      ? "rgba(217,119,6,0.05)"
                      : "var(--bg)",
                    borderLeft: accentColor ? `3px solid ${accentColor}` : "3px solid transparent",
                  }}
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/posts/${post.id}`} className="block hover:underline">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium line-clamp-1" style={{ color: "var(--fg)" }}>{post.title}</span>
                        {isFeatured && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(217,119,6,0.15)", color: "#d97706" }}>
                            <Star size={9} className="inline" />
                            Featured
                          </span>
                        )}
                        {isHero && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#7c3aed" }}>
                            <Home size={9} className="inline" />
                            Hero
                          </span>
                        )}
                      </div>
                      <span className="text-xs line-clamp-1" style={{ color: "var(--fg-3)" }}>{post.slug}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {post.category && (
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black"
                        style={{ backgroundColor: post.category.color ?? "#e63946" }}
                      >
                        {post.category.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[post.status] ?? ""}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs hidden lg:table-cell" style={{ color: "var(--fg-3)" }}>
                    {post.published_at ? formatDate(post.published_at) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconToggle
                        active={isFeatured}
                        activeColor="#d97706"
                        title={isFeatured ? "Unset as category featured" : "Set as category featured"}
                        icon={Star}
                        onClick={() => toggleField(post, "featured")}
                        busy={busy === `${post.id}-featured`}
                      />
                      <IconToggle
                        active={isHero}
                        activeColor="#7c3aed"
                        title={isHero ? "Unset as homepage hero" : "Set as homepage hero"}
                        icon={Home}
                        onClick={() => toggleField(post, "is_hero")}
                        busy={busy === `${post.id}-is_hero`}
                      />
                      <DeletePostButton id={post.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--fg-3)" }}>
            {searchQuery ? `No posts matching "${searchQuery}"` : "No posts yet."}
          </div>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--fg-3)" }}>
          {searchQuery
            ? `${total} result${total === 1 ? "" : "s"} for "${searchQuery}"`
            : `${total} post${total === 1 ? "" : "s"} total`}
        </p>

        {!searchQuery && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/posts?page=${page - 1}`}
              aria-disabled={page <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: page <= 1 ? "var(--fg-3)" : "var(--fg)",
                pointerEvents: page <= 1 ? "none" : undefined,
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </Link>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 text-center text-xs" style={{ color: "var(--fg-3)" }}>…</span>
                ) : (
                  <Link
                    key={p}
                    href={`/admin/posts?page=${p}`}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: p === page ? "#e63946" : "transparent",
                      color: p === page ? "#fff" : "var(--fg)",
                      border: `1px solid ${p === page ? "#e63946" : "var(--border)"}`,
                    }}
                  >
                    {p}
                  </Link>
                )
              )}

            <Link
              href={`/admin/posts?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: page >= totalPages ? "var(--fg-3)" : "var(--fg)",
                pointerEvents: page >= totalPages ? "none" : undefined,
                opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
