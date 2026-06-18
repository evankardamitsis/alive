import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { Plus } from "lucide-react"
import { PostsTable } from "@/components/admin/PostsTable"

export const revalidate = 0

const PAGE_SIZE = 50

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page: pageParam, q } = await searchParams
  const query = q?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const supabase = createAdminClient()

  const [postsResult, { data: featuredPosts }, { data: heroPosts }] = await Promise.all([
    query
      ? supabase
          .from("posts")
          .select("id, title, slug, status, featured, is_hero, published_at, updated_at, category_id, category:categories(name, color)", { count: "exact" })
          .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
          .order("updated_at", { ascending: false })
          .limit(500)
      : supabase
          .from("posts")
          .select("id, title, slug, status, featured, is_hero, published_at, updated_at, category_id, category:categories(name, color)", { count: "exact" })
          .order("updated_at", { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from("posts").select("id, category_id").eq("featured", true),
    supabase.from("posts").select("id").eq("is_hero", true).limit(1),
  ])

  const { data: posts, count } = postsResult
  const totalPages = query ? 1 : Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const featuredMap: Record<string, string> = {}
  for (const p of featuredPosts ?? []) {
    if (p.category_id) featuredMap[p.category_id] = p.id
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Posts</h1>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-lg bg-[#e63946] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors"
        >
          <Plus size={15} />
          New Post
        </Link>
      </div>
      <PostsTable
        posts={(posts ?? []) as any}
        page={page}
        totalPages={totalPages}
        total={count ?? 0}
        featuredMap={featuredMap}
        heroId={heroPosts?.[0]?.id ?? null}
        searchQuery={query}
      />
    </div>
  )
}
