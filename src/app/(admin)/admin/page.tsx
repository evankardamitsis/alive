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
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#222] bg-[#141414] p-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#222] bg-[#141414] p-6">
        <h2 className="text-sm font-semibold text-neutral-400 mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <a
            href="/admin/posts/new"
            className="rounded-lg bg-[#e63946] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors"
          >
            New Post
          </a>
          <a
            href="/admin/media"
            className="rounded-lg border border-[#333] px-4 py-2 text-sm font-semibold text-neutral-300 hover:border-[#555] transition-colors"
          >
            Upload Media
          </a>
        </div>
      </div>
    </div>
  )
}
