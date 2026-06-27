import { unstable_cache } from "next/cache"
import { createPublicClient } from "./public"
import { POSTS_CACHE_TAG } from "@/lib/revalidate-posts"
import type { PostWithRelations, Category } from "@/types"

const POST_SELECT = `*, author:authors(*), category:categories(*), tags:post_tags(tag:tags(*))`

function withRelations(posts: PostWithRelations[] | null): PostWithRelations[] {
  return (posts ?? []).filter(
    (post): post is PostWithRelations => Boolean(post.category && post.author)
  )
}

function liveNow() {
  return new Date().toISOString()
}

type LiveFilterableQuery<T> = {
  not(column: "published_at", operator: "is", value: null): T
  lte(column: "published_at", value: string): T
}

function applyLiveFilters<T extends LiveFilterableQuery<T>>(query: T): T {
  return query.not("published_at", "is", null).lte("published_at", liveNow())
}

type TagJoinRow = {
  slug?: string
  tag?: { slug?: string } | null
}

async function fetchPublishedPosts(options?: {
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

  let query = applyLiveFilters(
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
  )
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (categoryId) query = query.eq("category_id", categoryId)
  if (featured !== undefined) query = query.eq("featured", featured)
  if (excludeIds && excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`)

  const { data, error } = await query
  if (error) throw error
  return withRelations(data as PostWithRelations[])
}

export async function getPublishedPosts(options?: {
  limit?: number
  offset?: number
  categorySlug?: string
  featured?: boolean
  excludeIds?: string[]
}) {
  return unstable_cache(
    () => fetchPublishedPosts(options),
    ["getPublishedPosts", JSON.stringify(options ?? {})],
    { tags: [POSTS_CACHE_TAG], revalidate: 60 }
  )()
}

export async function getCategorySpotlights(perCategory = 4) {
  return unstable_cache(
    async () => {
      const categories = await getAllCategories()
      const results = await Promise.all(
        categories.map(async (cat) => {
          const [featuredPost, recent] = await Promise.all([
            fetchCategoryFeaturedPost(cat.slug),
            fetchPublishedPosts({ categorySlug: cat.slug, limit: perCategory + 1 }),
          ])
          let posts: PostWithRelations[]
          if (featuredPost) {
            const rest = recent.filter((p) => p.id !== featuredPost.id).slice(0, perCategory - 1)
            posts = [featuredPost, ...rest]
          } else {
            posts = recent.slice(0, perCategory)
          }
          return { category: cat, posts }
        })
      )
      return results.filter((r) => r.posts.length > 0)
    },
    ["getCategorySpotlights", String(perCategory)],
    { tags: [POSTS_CACHE_TAG], revalidate: 60 }
  )()
}

async function fetchPostBySlug(slug: string) {
  const supabase = createPublicClient()

  let { data } = await applyLiveFilters(
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
  ).maybeSingle()

  if (!data && slug.length > 60) {
    const prefix = slug.slice(0, 60)
    const { data: fallback } = await applyLiveFilters(
      supabase
        .from("posts")
        .select(POST_SELECT)
        .like("slug", `${prefix}%`)
        .eq("status", "published")
    )
      .limit(1)
      .maybeSingle()
    data = fallback
  }

  if (!data) return null
  const post = data as PostWithRelations
  if (!post.category || !post.author) return null
  return post
}

export async function getPostBySlug(slug: string) {
  return unstable_cache(
    () => fetchPostBySlug(slug),
    ["getPostBySlug", slug],
    { tags: [POSTS_CACHE_TAG], revalidate: 60 }
  )()
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

async function fetchHeroPost(): Promise<PostWithRelations | null> {
  const supabase = createPublicClient()
  const { data } = await applyLiveFilters(
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .eq("is_hero", true)
  )
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const post = data as PostWithRelations
  return post.category && post.author ? post : null
}

export async function getHeroPost(): Promise<PostWithRelations | null> {
  return unstable_cache(fetchHeroPost, ["getHeroPost"], {
    tags: [POSTS_CACHE_TAG],
    revalidate: 60,
  })()
}

async function fetchCategoryFeaturedPost(categorySlug: string): Promise<PostWithRelations | null> {
  const supabase = createPublicClient()
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle()
  if (!category?.id) return null

  const { data } = await applyLiveFilters(
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .eq("category_id", category.id)
      .eq("featured", true)
  )
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const post = data as PostWithRelations
  return post.category && post.author ? post : null
}

export async function getCategoryFeaturedPost(categorySlug: string): Promise<PostWithRelations | null> {
  return unstable_cache(
    () => fetchCategoryFeaturedPost(categorySlug),
    ["getCategoryFeaturedPost", categorySlug],
    { tags: [POSTS_CACHE_TAG], revalidate: 60 }
  )()
}

export async function getAdjacentPosts(post: PostWithRelations) {
  const supabase = createPublicClient()
  const date = post.published_at!

  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    applyLiveFilters(
      supabase
        .from("posts")
        .select(`id, title, slug, cover_image_url, cover_image_alt, category:categories(*)`)
        .eq("status", "published")
        .eq("category_id", post.category_id)
        .lt("published_at", date)
    )
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    applyLiveFilters(
      supabase
        .from("posts")
        .select(`id, title, slug, cover_image_url, cover_image_alt, category:categories(*)`)
        .eq("status", "published")
        .eq("category_id", post.category_id)
        .gt("published_at", date)
    )
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    prev: prevData as (PostWithRelations & { category: PostWithRelations["category"] }) | null,
    next: nextData as (PostWithRelations & { category: PostWithRelations["category"] }) | null,
  }
}

export async function getTagBySlug(slug: string) {
  const supabase = createPublicClient()
  const { data } = await supabase.from("tags").select("*").eq("slug", slug).maybeSingle()
  return data as { id: string; name: string; slug: string } | null
}

async function fetchPostsByTag(tagSlug: string, limit = 24) {
  const supabase = createPublicClient()
  const tag = await getTagBySlug(tagSlug)
  if (!tag) return []
  const { data, error } = await applyLiveFilters(
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
  )
    .order("published_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  const posts = withRelations(data as PostWithRelations[])
  return posts.filter((p) =>
    p.tags?.some((t: TagJoinRow) => t.slug === tagSlug || t.tag?.slug === tagSlug)
  )
}

export async function getPostsByTag(tagSlug: string, limit = 24) {
  return unstable_cache(
    () => fetchPostsByTag(tagSlug, limit),
    ["getPostsByTag", tagSlug, String(limit)],
    { tags: [POSTS_CACHE_TAG], revalidate: 60 }
  )()
}

export async function getAllTags() {
  const supabase = createPublicClient()
  const { data, error } = await supabase.from("tags").select("*").order("name")
  if (error) throw error
  return data as { id: string; name: string; slug: string }[]
}

type PublishedSlug = {
  slug: string
  published_at: string
  updated_at: string
  category: { slug: string }
}

async function fetchAllPublishedSlugs(): Promise<PublishedSlug[]> {
  const supabase = createPublicClient()
  const { data, error } = await applyLiveFilters(
    supabase
      .from("posts")
      .select("slug, published_at, updated_at, category:categories(slug)")
      .eq("status", "published")
  ).order("published_at", { ascending: false })
  if (error) throw error

  return (data ?? [])
    .map((row: {
      slug: string
      published_at: string
      updated_at: string
      category: { slug: string } | { slug: string }[] | null
    }) => {
      const category = Array.isArray(row.category) ? row.category[0] : row.category
      if (!category?.slug || !row.slug || !row.published_at || !row.updated_at) return null
      return {
        slug: row.slug,
        published_at: row.published_at,
        updated_at: row.updated_at,
        category: { slug: category.slug },
      }
    })
    .filter((row: PublishedSlug | null): row is PublishedSlug => row !== null)
}

export async function getAllPublishedSlugs(): Promise<PublishedSlug[]> {
  return unstable_cache(fetchAllPublishedSlugs, ["getAllPublishedSlugs"], {
    tags: [POSTS_CACHE_TAG],
    revalidate: 60,
  })()
}

async function fetchSearchPosts(query: string, limit = 24) {
  if (!query.trim()) return []
  const supabase = createPublicClient()
  const term = `%${query.trim()}%`
  const { data, error } = await applyLiveFilters(
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .or(`title.ilike.${term},excerpt.ilike.${term}`)
  )
    .order("published_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return withRelations(data as PostWithRelations[])
}

export async function searchPosts(query: string, limit = 24) {
  return unstable_cache(
    () => fetchSearchPosts(query, limit),
    ["searchPosts", query, String(limit)],
    { tags: [POSTS_CACHE_TAG], revalidate: 60 }
  )()
}

export async function getRelatedPosts(post: PostWithRelations, limit = 4) {
  const supabase = createPublicClient()
  const { data } = await applyLiveFilters(
    supabase
      .from("posts")
      .select(`*, author:authors(*), category:categories(*)`)
      .eq("status", "published")
      .eq("category_id", post.category_id)
      .neq("id", post.id)
  )
    .order("published_at", { ascending: false })
    .limit(limit)

  return withRelations(data as PostWithRelations[])
}
