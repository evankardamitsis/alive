import { createAdminClient } from "@/lib/supabase/admin"
import { PostEditor } from "@/components/admin/PostEditor"

export const revalidate = 0

export default async function NewPostPage() {
  const supabase = createAdminClient()

  const [{ data: categories }, { data: featuredPosts }, { data: heroPosts }] = await Promise.all([
    supabase.from("categories").select("id, name, color").order("name"),
    supabase.from("posts").select("id, category_id").eq("featured", true),
    supabase.from("posts").select("id").eq("is_hero", true).limit(1),
  ])

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
    />
  )
}
