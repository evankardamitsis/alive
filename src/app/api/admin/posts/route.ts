import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdminUser(); if (authError) return authError
  const body = await req.json()
  const supabase = createAdminClient()

  if (body.featured === true && body.category_id) {
    await supabase
      .from("posts")
      .update({ featured: false })
      .eq("category_id", body.category_id)
      .eq("featured", true)
  }

  if (body.is_hero === true) {
    await supabase
      .from("posts")
      .update({ is_hero: false })
      .eq("is_hero", true)
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select("*, category:categories(slug)")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath("/")
  const catSlug = Array.isArray(data.category) ? data.category[0]?.slug : (data.category as any)?.slug
  if (catSlug) revalidatePath(`/${catSlug}`)

  return NextResponse.json(data)
}
