import { createPublicClient } from "./public"
import type { PostWithRelations, Category } from "@/types"

function withRelations(posts: PostWithRelations[] | null): PostWithRelations[] {
  return (posts ?? []).filter(
    (post): post is PostWithRelations => Boolean(post.category && post.author)
  )
}

export async function getPublishedPosts(options?: {
  limit?: number
  offset?: number
  categorySlug?: string
  featured?: boolean
  excludeIds?: string[]
}) {
  const supabase = createPublicClient()
  const { limit = 12, offset = 0, categorySlug, featured, excludeIds } = options ?? {}

  let categoryId: string | undefined
  if (categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle()
    categoryId = category?.id
    if (!categoryId) return []
  }

  let query = supabase
    .from("posts")
    .select(
      `*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (categoryId) query = query.eq("category_id", categoryId)
  if (featured !== undefined) query = query.eq("featured", featured)
  if (excludeIds && excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`)

  const { data, error } = await query
  if (error) throw error
  return withRelations(data as PostWithRelations[])
}

export async function getCategorySpotlights(perCategory = 4) {
  const categories = await getAllCategories()
  const results = await Promise.all(
    categories.map(async (cat) => {
      const posts = await getPublishedPosts({ categorySlug: cat.slug, limit: perCategory })
      return { category: cat, posts }
    })
  )
  return results.filter((r) => r.posts.length > 0)
}

export async function getPostBySlug(slug: string) {
  const supabase = createPublicClient()

  // Try exact match first
  let { data } = await supabase
    .from("posts")
    .select(`*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  // WP truncates long slugs — fall back to prefix match
  if (!data && slug.length > 60) {
    const prefix = slug.slice(0, 60)
    const { data: fallback } = await supabase
      .from("posts")
      .select(`*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`)
      .like("slug", `${prefix}%`)
      .eq("status", "published")
      .limit(1)
      .maybeSingle()
    data = fallback
  }

  if (!data) return null
  const post = data as PostWithRelations
  if (!post.category || !post.author) return null
  return post
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createPublicClient()
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

export async function getAdjacentPosts(post: PostWithRelations) {
  const supabase = createPublicClient()
  const date = post.published_at!

  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    supabase
      .from("posts")
      .select(`id, title, slug, cover_image_url, cover_image_alt, category:categories(*)`)
      .eq("status", "published")
      .eq("category_id", post.category_id)
      .lt("published_at", date)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select(`id, title, slug, cover_image_url, cover_image_alt, category:categories(*)`)
      .eq("status", "published")
      .eq("category_id", post.category_id)
      .gt("published_at", date)
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    prev: prevData as (PostWithRelations & { category: PostWithRelations["category"] }) | null,
    next: nextData as (PostWithRelations & { category: PostWithRelations["category"] }) | null,
  }
}

export async function searchPosts(query: string, limit = 24) {
  if (!query.trim()) return []
  const supabase = createPublicClient()
  const term = `%${query.trim()}%`
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`)
    .eq("status", "published")
    .or(`title.ilike.${term},excerpt.ilike.${term}`)
    .order("published_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return withRelations(data as PostWithRelations[])
}

export async function getRelatedPosts(post: PostWithRelations, limit = 4) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("posts")
    .select(`*, author:authors(*), category:categories(*)`)
    .eq("status", "published")
    .eq("category_id", post.category_id)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(limit)

  return withRelations(data as PostWithRelations[])
}
