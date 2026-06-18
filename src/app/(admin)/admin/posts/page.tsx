import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate } from "@/lib/utils"
import { Plus, Pencil } from "lucide-react"
import { DeletePostButton } from "@/components/admin/DeletePostButton"

export const revalidate = 0

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-600",
  draft:     "bg-neutral-500/15 text-neutral-500",
  scheduled: "bg-amber-500/15 text-amber-600",
  archived:  "bg-red-500/15 text-red-500",
}

export default async function PostsPage() {
  const supabase = createAdminClient()
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, status, featured, published_at, category:categories(name, color)")
    .order("updated_at", { ascending: false })
    .limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Posts</h1>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-lg bg-[#e63946] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors"
        >
          <Plus size={15} />
          New Post
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--fg-3)" }}>Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--fg-3)" }}>Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((post: any) => (
              <tr
                key={post.id}
                className="transition-colors"
                style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium line-clamp-1" style={{ color: "var(--fg)" }}>{post.title}</span>
                    {post.featured && (
                      <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="text-xs line-clamp-1" style={{ color: "var(--fg-3)" }}>{post.slug}</span>
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
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: "var(--fg-3)" }}
                    >
                      <Pencil size={13} />
                    </Link>
                    <DeletePostButton id={post.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!posts || posts.length === 0) && (
          <div className="py-16 text-center text-sm" style={{ color: "var(--fg-3)" }}>
            No posts yet.{" "}
            <Link href="/admin/posts/new" className="text-[#e63946] hover:underline">
              Create your first post
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
