import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { normalizePostPayload, resolveAuthorId } from "@/lib/supabase/post-payload"
import { revalidatePublishedPost } from "@/lib/revalidate-posts"

function categorySlug(data: { category?: unknown }) {
  const category = Array.isArray(data.category) ? data.category[0] : data.category
  return (category as { slug?: string } | null)?.slug ?? null
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAdminUser()
  if (authError) return authError

  const body = await req.json()
  const payload = normalizePostPayload(body)

  if (!payload.category_id) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  let authorId =
    typeof body.author_id === "string" && body.author_id.trim()
      ? body.author_id.trim()
      : null

  if (authorId) {
    const { data: author } = await supabase
      .from("authors")
      .select("id")
      .eq("id", authorId)
      .maybeSingle()
    if (!author) {
      return NextResponse.json({ error: "Selected author was not found" }, { status: 400 })
    }
  } else {
    authorId = await resolveAuthorId(supabase, user!.email)
  }

  if (!authorId) {
    return NextResponse.json(
      { error: "Author is required. Choose an author or create one in Admin → Authors." },
      { status: 400 }
    )
  }

  if (payload.featured === true && payload.category_id) {
    await supabase
      .from("posts")
      .update({ featured: false })
      .eq("category_id", payload.category_id)
      .eq("featured", true)
  }

  if (payload.is_hero === true) {
    await supabase
      .from("posts")
      .update({ is_hero: false })
      .eq("is_hero", true)
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...payload,
      author_id: authorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*, category:categories(slug)")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublishedPost({ categorySlug: categorySlug(data), slug: data.slug })

  return NextResponse.json(data)
}
