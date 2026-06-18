import { NextRequest, NextResponse } from "next/server"
import { searchPosts } from "@/lib/supabase/queries"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (!q || q.length < 2) return NextResponse.json([])
  const results = await searchPosts(q, 12)
  return NextResponse.json(
    results.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      cover_image_url: p.cover_image_url,
      published_at: p.published_at,
      category: { name: p.category.name, slug: p.category.slug, color: p.category.color },
    }))
  )
}
