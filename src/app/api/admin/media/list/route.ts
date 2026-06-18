import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"

const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i

async function listFolder(supabase: ReturnType<typeof createAdminClient>, prefix: string): Promise<{ name: string; path: string }[]> {
  const { data: files } = await supabase.storage
    .from("media")
    .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } })

  const results: { name: string; path: string }[] = []
  for (const f of files ?? []) {
    if (f.name === ".emptyFolderPlaceholder") continue
    const fullPath = prefix ? `${prefix}/${f.name}` : f.name
    if (f.metadata == null) {
      // It's a folder — recurse
      const nested = await listFolder(supabase, fullPath)
      results.push(...nested)
    } else if (IMAGE_RE.test(f.name)) {
      results.push({ name: f.name, path: fullPath })
    }
  }
  return results
}

export async function GET() {
  const { error: authError } = await requireAdminUser(); if (authError) return authError
  const supabase = createAdminClient()
  const files = await listFolder(supabase, "")

  const { data: { publicUrl: base } } = supabase.storage.from("media").getPublicUrl("")

  const items = files.map((f) => ({
    name: f.name,
    url: `${base}${f.path}`,
  }))

  return NextResponse.json(items)
}
