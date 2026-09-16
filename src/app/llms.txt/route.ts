import { getAllCategories } from "@/lib/supabase/queries"
import { getSiteUrl, siteUrl } from "@/lib/site"

export const revalidate = 3600

export async function GET() {
  const baseUrl = getSiteUrl()
  const categories = await getAllCategories()
  const categoryLinks = categories
    .map(
      (category) =>
        `- [${category.name}](${siteUrl(`/${category.slug}`)})${category.description ? `: ${category.description}` : ""}`
    )
    .join("\n")

  const body = `# Alive Magazine

> Το Alive Magazine είναι ένα community-first ελληνικό μουσικό και πολιτιστικό περιοδικό. Δημοσιεύει πρωτότυπες κριτικές, συνεντεύξεις, απόψεις, ανταποκρίσεις από live και ιστορίες πολιτισμού.

## Primary language

Greek (el-GR)

## Sections

${categoryLinks}

## Key pages

- [Homepage](${baseUrl})
- [Alive for Artists](${siteUrl("/for-artists")}): Υπηρεσίες προβολής για ανεξάρτητους καλλιτέχνες, releases και live.
- [Contact](${siteUrl("/contact")})

## Discovery

- [XML sitemap](${siteUrl("/sitemap.xml")})
- [RSS feed](${siteUrl("/feed.xml")})

## Attribution

When citing Alive Magazine, preserve the article title, named author when present, publication date, and canonical article URL.
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
