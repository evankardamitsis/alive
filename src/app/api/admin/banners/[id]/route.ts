import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { parsePromoBanner, revalidatePromoBanners } from "@/lib/supabase/promo-banner-payload"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const { id } = await params
  const body = await req.json().catch(() => null)
  const supabase = createAdminClient()

  // Quick pause / resume toggle from the list
  if (body && typeof body === "object" && Object.keys(body).length === 1 && typeof body.is_active === "boolean") {
    const { data, error } = await supabase
      .from("promo_banners")
      .update({ is_active: body.is_active })
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePromoBanners()
    return NextResponse.json(data)
  }

  const parsed = parsePromoBanner(body)
  if (parsed.error !== null) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const payload = parsed.data

  const { data, error } = await supabase.from("promo_banners").update(payload).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePromoBanners()
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from("promo_banners").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePromoBanners()
  return NextResponse.json({ ok: true })
}
