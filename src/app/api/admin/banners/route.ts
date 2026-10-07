import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { parsePromoBanner, revalidatePromoBanners } from "@/lib/supabase/promo-banner-payload"

export async function GET() {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("promo_banners")
    .select("*")
    .order("starts_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const parsed = parsePromoBanner(await req.json().catch(() => null))
  if (parsed.error !== null) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const payload = parsed.data

  const supabase = createAdminClient()
  const { data, error } = await supabase.from("promo_banners").insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePromoBanners()
  return NextResponse.json(data)
}
