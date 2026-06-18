/**
 * Fixes the 3 images that failed due to Greek characters in the filename.
 * Sanitizes the storage key to ASCII before uploading.
 */

import { createClient } from "@supabase/supabase-js"
import ws from "ws"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { realtime: { transport: ws } }
)

const BUCKET = "media"

function sanitizeKey(url: string): string {
  const { pathname } = new URL(url)
  const parts = pathname.split("/").filter(Boolean)
  const filename = parts.pop()!
  // Encode then strip non-ASCII percent sequences → safe ASCII slug
  const encoded = encodeURIComponent(filename)
  const safe = encoded
    .replace(/%[0-9A-Fa-f]{2}/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return `wp/${parts.join("/")}/${safe}`
}

const FAILED_URLS = [
  "https://alivemag.gr/wp-content/uploads/2025/09/Ανώνυμο-σχέδιο.pdf",
  "https://alivemag.gr/wp-content/uploads/2025/09/Ανώνυμο-σχέδιο-6.jpg",
  "https://alivemag.gr/wp-content/uploads/2025/09/Ανώνυμο-σχέδιο-2.png",
]

const cache = new Map<string, string>()

async function main() {
  console.log("Migrating Greek-filename images…\n")

  for (const url of FAILED_URLS) {
    const path = sanitizeKey(url)
    console.log(`  ${url.split("/").pop()} → ${path}`)

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) { console.log(`  ✗ ${res.status}`); continue }

    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const buffer = Buffer.from(await res.arrayBuffer())

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) { console.log(`  ✗ ${error.message}`); continue }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    cache.set(url, publicUrl)
    console.log(`  ✓ ${publicUrl}\n`)
  }

  if (!cache.size) { console.log("Nothing uploaded."); return }

  // Update posts that reference these URLs
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, cover_image_url, content")

  let updated = 0
  for (const post of posts ?? []) {
    let newCover = post.cover_image_url
    let newContent = post.content

    for (const [oldUrl, newUrl] of cache) {
      if (newCover?.includes(oldUrl)) newCover = newCover.replace(oldUrl, newUrl)
      if (newContent?.includes(oldUrl)) newContent = newContent.replaceAll(oldUrl, newUrl)
    }

    if (newCover === post.cover_image_url && newContent === post.content) continue

    await supabase
      .from("posts")
      .update({ cover_image_url: newCover, content: newContent })
      .eq("id", post.id)

    console.log(`  ✓ updated: ${post.title?.slice(0, 60)}`)
    updated++
  }

  console.log(`\nDone. Updated ${updated} posts.`)
}

main()
