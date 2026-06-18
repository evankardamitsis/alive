import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdminUser(); if (authError) return authError
  const body = await req.json()
  const supabase = createAdminClient()
  const slug = body.slug || slugify(body.name)
  const { data, error } = await supabase
    .from("authors")
    .insert({ ...body, slug })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
