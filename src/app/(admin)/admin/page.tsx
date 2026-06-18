import { createAdminClient } from "@/lib/supabase/admin"

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [{ count: totalPosts }, { count: drafts }, { count: published }] =
    await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    ])

  const stats = [
    { label: "Total Posts", value: totalPosts ?? 0 },
    { label: "Published", value: published ?? 0 },
    { label: "Drafts", value: drafts ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--fg)" }}>Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-6"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--fg-3)" }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: "var(--fg)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-6"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--fg-2)" }}>Quick Actions</h2>
        <div className="flex gap-3">
          <a
            href="/admin/posts/new"
            className="rounded-lg bg-[#e63946] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors"
          >
            New Post
          </a>
          <a
            href="/admin/media"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
          >
            Upload Media
          </a>
        </div>
      </div>
    </div>
  )
}
