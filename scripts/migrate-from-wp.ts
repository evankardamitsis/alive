/**
 * WordPress → Supabase migration script
 * Run: npx tsx scripts/migrate-from-wp.ts
 *
 * Pulls all published posts from alivemag.gr WP REST API
 * and inserts them into Supabase (authors, categories, tags, posts).
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import slugify from "slugify"
import he from "he"

function loadEnvFile(filename: string) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // file missing — rely on existing env vars
  }
}

loadEnvFile(".env.local")
loadEnvFile(".env")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing. Set it in .env.local.")
}
if (!secretKey || secretKey === "your-secret-key") {
  throw new Error(
    "SUPABASE_SECRET_KEY is missing. Copy it from Supabase → Project Settings → API Keys → secret."
  )
}

const WP_BASE = "https://alivemag.gr/wp-json/wp/v2"
const supabase = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
})

function toSlug(str: string) {
  return slugify(str, { lower: true, strict: true, locale: "el" })
}

async function fetchAllPages<T>(path: string, extraParams: Record<string, string> = {}): Promise<T[]> {
  let page = 1
  const results: T[] = []
  while (true) {
    const url = new URL(`${WP_BASE}/${path}`)
    url.searchParams.set("per_page", "100")
    url.searchParams.set("page", String(page))
    for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v)
    const res = await fetch(url.toString())
    if (!res.ok) break
    const data: T[] = await res.json()
    if (!data.length) break
    results.push(...data)
    const total = Number(res.headers.get("X-WP-TotalPages") ?? 1)
    if (page >= total) break
    page++
  }
  return results
}

async function main() {
  console.log("Fetching WP data…")
  const [wpPosts, wpCategories, wpAuthors, wpTags] = await Promise.all([
    fetchAllPages<any>("posts", { status: "publish", _embed: "wp:featuredmedia" }),
    fetchAllPages<any>("categories"),
    fetchAllPages<any>("users"),
    fetchAllPages<any>("tags"),
  ])

  console.log(`Posts: ${wpPosts.length} | Categories: ${wpCategories.length} | Authors: ${wpAuthors.length} | Tags: ${wpTags.length}`)

  // ── 1. Upsert authors ──────────────────────────────────────
  const authorMap = new Map<number, string>() // wpId → supabase uuid
  for (const u of wpAuthors) {
    const slug = toSlug(u.name)
    const { data } = await supabase
      .from("authors")
      .upsert({ name: u.name, slug, email: u.email || `${slug}@alivemag.gr`, role: "editor" }, { onConflict: "slug" })
      .select("id")
      .single()
    if (data) authorMap.set(u.id, data.id)
  }
  console.log("Authors done.")

  // ── 2. Upsert categories ───────────────────────────────────
  const categoryMap = new Map<number, string>()
  for (const c of wpCategories) {
    if (c.name === "Uncategorized") continue
    const slug = toSlug(c.name)
    const { data } = await supabase
      .from("categories")
      .upsert({ name: c.name, slug, description: c.description || null }, { onConflict: "slug" })
      .select("id")
      .single()
    if (data) categoryMap.set(c.id, data.id)
  }
  console.log("Categories done.")

  // ── 3. Upsert tags ────────────────────────────────────────
  const tagMap = new Map<number, string>()
  for (const t of wpTags) {
    const slug = toSlug(t.name)
    const { data } = await supabase
      .from("tags")
      .upsert({ name: t.name, slug }, { onConflict: "slug" })
      .select("id")
      .single()
    if (data) tagMap.set(t.id, data.id)
  }
  console.log("Tags done.")

  // ── 4. Upsert posts ───────────────────────────────────────
  const fallbackAuthorId = [...authorMap.values()][0]
  const fallbackCategoryId = [...categoryMap.values()][0]

  for (const p of wpPosts) {
    const slug = p.slug || toSlug(p.title.rendered)
    const authorId = authorMap.get(p.author) ?? fallbackAuthorId
    const categoryId = categoryMap.get(p.categories?.[0]) ?? fallbackCategoryId

    const { data: post } = await supabase
      .from("posts")
      .upsert(
        {
          title: p.title.rendered,
          slug,
          excerpt: p.excerpt?.rendered?.replace(/<[^>]+>/g, "").trim() || null,
          content: p.content.rendered,
          status: "published",
          author_id: authorId,
          category_id: categoryId,
          cover_image_url: p.jetpack_featured_media_url || p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null,
          published_at: p.date,
          wp_id: p.id,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single()

    // Link tags
    if (post && p.tags?.length) {
      const tagLinks = p.tags
        .map((tId: number) => tagMap.get(tId))
        .filter(Boolean)
        .map((tagId: string) => ({ post_id: post.id, tag_id: tagId }))

      if (tagLinks.length) {
        await supabase.from("post_tags").upsert(tagLinks, { onConflict: "post_id,tag_id" })
      }
    }
  }

  console.log("Migration complete.")
}

main().catch(console.error)
