import { createClient } from "./server"
import type { PostWithRelations, Category } from "@/types"

export async function getPublishedPosts(options?: {
  limit?: number
  offset?: number
  categorySlug?: string
  featured?: boolean
}) {
  const supabase = await createClient()
  const { limit = 12, offset = 0, categorySlug, featured } = options ?? {}

  let query = supabase
    .from("posts")
    .select(
      `*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug)
  }
  if (featured !== undefined) {
    query = query.eq("featured", featured)
  }

  const { data, error } = await query
  if (error) throw error
  return data as PostWithRelations[]
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error) return null
  return data as PostWithRelations
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")

  if (error) throw error
  return data
}

export async function getFeaturedPosts(limit = 5) {
  return getPublishedPosts({ featured: true, limit })
}

export async function getRelatedPosts(post: PostWithRelations, limit = 4) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(`*, author:authors(*), category:categories(*)`)
    .eq("status", "published")
    .eq("category_id", post.category_id)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit)

  return (data ?? []) as PostWithRelations[]
}
