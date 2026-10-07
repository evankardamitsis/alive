import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { pickAuthorFields } from "@/lib/supabase/author-payload"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError
  const { id } = await params
  const body = pickAuthorFields(await req.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("authors")
    .update(body)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from("authors").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
