import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
