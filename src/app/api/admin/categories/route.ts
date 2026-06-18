import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const { name, slug, color, description } = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, color, description })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
