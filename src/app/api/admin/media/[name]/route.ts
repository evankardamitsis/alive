import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from("media").remove([decodeURIComponent(name)])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Rename: move the file to a new path within the same folder
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const { newName } = await req.json()
  if (!newName) return NextResponse.json({ error: "newName required" }, { status: 400 })

  const oldPath = decodeURIComponent(name)
  // Keep the same folder prefix, only replace the filename
  const folder = oldPath.includes("/") ? oldPath.slice(0, oldPath.lastIndexOf("/") + 1) : ""
  const newPath = folder + newName

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from("media").move(oldPath, newPath)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(newPath)
  return NextResponse.json({ url: publicUrl, path: newPath })
}
