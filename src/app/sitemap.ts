import type { MetadataRoute } from "next"
import { getAllCategories, getAllTags, getAllPublishedSlugs } from "@/lib/supabase/queries"

const BASE = "https://alivemag.gr"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories, tags] = await Promise.all([
    getAllPublishedSlugs(),
    getAllCategories(),
    getAllTags(),
  ])

  const posts: MetadataRoute.Sitemap = slugs.map((p) => ({
    url: `${BASE}/${p.category.slug}/${p.slug}`,
    lastModified: new Date(p.updated_at ?? p.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const cats: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }))

  const tagPages: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${BASE}/tag/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "monthly", priority: 0.3 },
    ...cats,
    ...tagPages,
    ...posts,
  ]
}
