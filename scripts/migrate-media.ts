/**
 * Migrates all WordPress media to Supabase Storage.
 * - Downloads every alivemag.gr image from cover_image_url and post content
 * - Uploads to the "media" bucket under a "wp/" prefix
 * - Updates cover_image_url and content in the posts table
 *
 * Run: pnpm exec tsx --env-file=.env.local scripts/migrate-media.ts
 * Safe to re-run — uses upsert, skips already-migrated URLs.
 */

import { createClient } from "@supabase/supabase-js"
import ws from "ws"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { realtime: { transport: ws } }
)

const BUCKET = "media"
const WP_ORIGIN = "https://alivemag.gr"

// old URL → new Supabase public URL
const cache = new Map<string, string>()

// Find all alivemag.gr image URLs in a string (src, srcset, CSS background, etc.)
function extractWpUrls(text: string): string[] {
  const matches = text.match(/https:\/\/alivemag\.gr\/wp-content\/[^\s"'>,)]+/g) ?? []
  // Strip srcset size descriptors like " 768w" and query strings from CDN resizes
  return [...new Set(matches.map((u) => u.split("?")[0]))]
}

function storagePath(url: string): string {
  // https://alivemag.gr/wp-content/uploads/2024/03/image.jpg
  // → wp/wp-content/uploads/2024/03/image.jpg
  const path = new URL(url).pathname.replace(/^\//, "")
  return `wp/${path}`
}

async function migrateUrl(url: string): Promise<string | null> {
  if (cache.has(url)) return cache.get(url)!

  const path = storagePath(url)

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      process.stdout.write(` ✗ ${res.status}\n`)
      return null
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const buffer = Buffer.from(await res.arrayBuffer())

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) {
      process.stdout.write(` ✗ ${error.message}\n`)
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    cache.set(url, publicUrl)
    return publicUrl
  } catch (err: any) {
    process.stdout.write(` ✗ ${err.message}\n`)
    return null
  }
}

// Replace all old WP URLs in a string with their migrated counterparts
function replaceUrls(text: string): string {
  let result = text
  for (const [oldUrl, newUrl] of cache) {
    // Replace both the base URL and any query-string variants
    result = result.replaceAll(oldUrl, newUrl)
  }
  return result
}

// Migrate up to `concurrency` URLs at a time
async function migrateAll(urls: string[], concurrency = 4): Promise<void> {
  const queue = [...urls]
  let done = 0

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()!
      process.stdout.write(`  [${++done}/${urls.length}] ${url.slice(WP_ORIGIN.length).slice(0, 60)}…`)
      const result = await migrateUrl(url)
      if (result) process.stdout.write(" ✓\n")
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
}

async function main() {
  console.log("Fetching posts…")

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, cover_image_url, content")

  if (error) { console.error(error.message); process.exit(1) }
  if (!posts?.length) { console.log("No posts found."); return }

  console.log(`Found ${posts.length} posts. Collecting image URLs…`)

  // Collect all unique WP image URLs across all posts
  const allUrls = new Set<string>()
  for (const post of posts) {
    if (post.cover_image_url?.includes(WP_ORIGIN)) {
      allUrls.add(post.cover_image_url.split("?")[0])
    }
    if (post.content) {
      extractWpUrls(post.content).forEach((u) => allUrls.add(u))
    }
  }

  const urlList = [...allUrls]
  if (!urlList.length) {
    console.log("No WordPress images found — all images may already be migrated.")
    return
  }

  console.log(`\nMigrating ${urlList.length} unique images to Supabase Storage…\n`)
  await migrateAll(urlList)

  const succeeded = cache.size
  const failed = urlList.length - succeeded
  console.log(`\n✓ Uploaded ${succeeded} images${failed ? `, ✗ ${failed} failed` : ""}.`)

  if (!succeeded) { console.log("Nothing to update."); return }

  // Update posts
  console.log("\nUpdating posts…")
  let updated = 0

  for (const post of posts) {
    const newCover = post.cover_image_url
      ? (cache.get(post.cover_image_url.split("?")[0]) ?? post.cover_image_url)
      : post.cover_image_url

    const newContent = post.content ? replaceUrls(post.content) : post.content

    const changed =
      newCover !== post.cover_image_url ||
      newContent !== post.content

    if (!changed) continue

    const { error: updateError } = await supabase
      .from("posts")
      .update({ cover_image_url: newCover, content: newContent })
      .eq("id", post.id)

    if (updateError) {
      console.error(`  ✗ Failed to update post ${post.id}: ${updateError.message}`)
    } else {
      console.log(`  ✓ ${post.title?.slice(0, 60) ?? post.id}`)
      updated++
    }
  }

  console.log(`\nDone. Updated ${updated} posts.`)
}

main()
