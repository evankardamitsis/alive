import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdminUser(); if (authError) return authError
  const fd = await req.formData()
  const file = fd.get("file") as File | null
  const name = fd.get("name") as string | null

  if (!file || !name) return NextResponse.json({ error: "Missing file or name" }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from("media")
    .upload(name, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(name)
  return NextResponse.json({ url: publicUrl })
}
