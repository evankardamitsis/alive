import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { normalizePostPayload, resolveAuthorId } from "@/lib/supabase/post-payload"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAdminUser()
  if (authError) return authError

  const body = await req.json()
  const payload = normalizePostPayload(body)

  if (!payload.category_id) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const authorId = await resolveAuthorId(supabase, user!.email)
  if (!authorId) {
    return NextResponse.json(
      { error: "No author profile found. Create an author with your email in Admin → Authors first." },
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

  revalidatePath("/")
  const catSlug = Array.isArray(data.category) ? data.category[0]?.slug : (data.category as any)?.slug
  if (catSlug) revalidatePath(`/${catSlug}`)

  return NextResponse.json(data)
}
