import { createAdminClient } from "@/lib/supabase/admin"
import { PostEditor } from "@/components/admin/PostEditor"
import { notFound } from "next/navigation"

export const revalidate = 0

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name, color").order("name"),
  ])

  if (!post) notFound()

  return (
    <PostEditor
      categories={categories ?? []}
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
        category_id: post.category_id ?? "",
        published_at: post.published_at,
        read_time: post.read_time ?? 3,
      }}
    />
  )
}
