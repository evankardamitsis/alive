import { getPublishedPosts, getAllCategories } from "@/lib/supabase/queries"

const BASE = "https://alivemag.gr"

function escape(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function GET() {
  const [posts, categories] = await Promise.all([
    getPublishedPosts({ limit: 50 }),
    getAllCategories(),
  ])

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const items = posts.map((post) => {
    const cat = catMap[post.category_id]
    const url = `${BASE}/${cat?.slug ?? ""}/${post.slug}`
    const pubDate = new Date(post.published_at!).toUTCString()
    const description = post.excerpt
      ? escape(post.excerpt.replace(/<[^>]+>/g, ""))
      : ""

    return `
    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${description ? `<description>${description}</description>` : ""}
      ${post.cover_image_url ? `<enclosure url="${post.cover_image_url}" type="image/jpeg" length="0"/>` : ""}
      ${cat ? `<category>${escape(cat.name)}</category>` : ""}
    </item>`
  }).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Alive Magazine</title>
    <link>${BASE}</link>
    <description>Το πρώτο community-first μουσικό blog στην Ελλάδα.</description>
    <language>el</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  })
}
