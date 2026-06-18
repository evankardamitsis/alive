import { createAdminClient } from "@/lib/supabase/admin"
import { PostEditor } from "@/components/admin/PostEditor"
import { notFound } from "next/navigation"

export const revalidate = 0

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: post }, { data: categories }, { data: featuredPosts }, { data: heroPosts }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name, color").order("name"),
    supabase.from("posts").select("id, category_id").eq("featured", true),
    supabase.from("posts").select("id").eq("is_hero", true).limit(1),
  ])

  if (!post) notFound()

  const featuredMap: Record<string, string> = {}
  for (const p of featuredPosts ?? []) {
    if (p.category_id) featuredMap[p.category_id] = p.id
  }

  const enrichedCategories = (categories ?? []).map((c) => ({
    ...c,
    featuredPostId: featuredMap[c.id] ?? null,
  }))

  return (
    <PostEditor
      categories={enrichedCategories}
      currentHeroId={heroPosts?.[0]?.id ?? null}
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        cover_image_url: post.cover_image_url ?? "",
        cover_image_alt: post.cover_image_alt ?? "",
        status: post.status,
        featured: post.featured ?? false,
        is_hero: post.is_hero ?? false,
        category_id: post.category_id ?? "",
        published_at: post.published_at,
        read_time: post.read_time ?? 3,
      }}
    />
  )
}
