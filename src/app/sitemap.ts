import type { MetadataRoute } from "next"
import {
  getAllCategories,
  getAllTags,
  getAllPublishedSlugs,
  getPublicAuthors,
  getTagPostCounts,
} from "@/lib/supabase/queries"
import { MIN_POSTS_TO_INDEX_TAG } from "@/lib/metadata"
import { getSiteUrl, siteUrl } from "@/lib/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const [slugs, categories, tags, authors, tagCounts] = await Promise.all([
    getAllPublishedSlugs(),
    getAllCategories(),
    getAllTags(),
    getPublicAuthors(),
    getTagPostCounts(),
  ])

  const posts: MetadataRoute.Sitemap = slugs.map((p) => ({
    url: siteUrl(`/${p.category.slug}/${p.slug}`),
    lastModified: new Date(p.updated_at ?? p.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
    ...(p.cover_image_url ? { images: [p.cover_image_url] } : {}),
  }))

  const cats: MetadataRoute.Sitemap = categories.map((c) => ({
    url: siteUrl(`/${c.slug}`),
    changeFrequency: "daily",
    priority: 0.7,
  }))

  // Only tags whose pages are indexable (see the tag page's metadata).
  const tagPages: MetadataRoute.Sitemap = tags
    .filter((t) => (tagCounts[t.id] ?? 0) >= MIN_POSTS_TO_INDEX_TAG)
    .map((t) => ({
      url: siteUrl(`/tag/${t.slug}`),
      changeFrequency: "weekly",
      priority: 0.5,
    }))

  const authorPages: MetadataRoute.Sitemap = authors.map((a) => ({
    url: siteUrl(`/author/${a.slug}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/for-artists"), changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    ...cats,
    ...tagPages,
    ...authorPages,
    ...posts,
  ]
}
