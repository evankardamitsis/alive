import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { normalizePostPayload } from "@/lib/supabase/post-payload"
import { revalidatePublishedPost } from "@/lib/revalidate-posts"

function categorySlug(data: { category?: unknown }) {
  const category = Array.isArray(data.category) ? data.category[0] : data.category
  return (category as { slug?: string } | null)?.slug ?? null
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const { id } = await params
  const supabase = createAdminClient()

  const { data: post } = await supabase
    .from("posts")
    .select("slug, category:categories(slug)")
    .eq("id", id)
    .single()

  const { error } = await supabase.from("posts").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublishedPost({
    categorySlug: categorySlug(post ?? {}),
    slug: post?.slug ?? null,
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const { id } = await params
  const body = await req.json()
  const payload = normalizePostPayload(body)
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("posts")
    .select("slug, category:categories(slug)")
    .eq("id", id)
    .single()

  if (payload.featured === true && payload.category_id) {
    await supabase
      .from("posts")
      .update({ featured: false })
      .eq("category_id", payload.category_id)
      .eq("featured", true)
      .neq("id", id)
  }

  if (payload.is_hero === true) {
    await supabase
      .from("posts")
      .update({ is_hero: false })
      .eq("is_hero", true)
      .neq("id", id)
  }

  const { data, error } = await supabase
    .from("posts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, category:categories(slug)")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublishedPost({
    categorySlug: categorySlug(data),
    slug: data.slug,
    previousCategorySlug: categorySlug(existing ?? {}),
    previousSlug: existing?.slug ?? null,
  })

  return NextResponse.json(data)
}
