import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"
import { toSlug } from "@/lib/slugify"

// Columns that must not be copied: identity, generated columns, publishing
// state and homepage/category placement flags.
const OMIT = new Set([
  "id",
  "search_vector",
  "slug",
  "title",
  "status",
  "featured",
  "is_hero",
  "published_at",
  "scheduled_at",
  "wp_id",
  "created_at",
  "updated_at",
])

// Builds "<title> (copy)" / "<title> (copy 2)" and a slug generated from that
// new title, picking the first number whose slug is free.
async function copyTitleAndSlug(
  supabase: ReturnType<typeof createAdminClient>,
  title: string,
  fallbackSlug: string
) {
  const base = toSlug(title) || fallbackSlug
  const { data } = await supabase.from("posts").select("slug").like("slug", `${base}-copy%`)
  const taken = new Set((data ?? []).map((p) => p.slug))
  let n = 1
  const slugFor = (i: number) => (i === 1 ? `${base}-copy` : `${base}-copy-${i}`)
  while (taken.has(slugFor(n))) n++
  return {
    title: n === 1 ? `${title} (copy)` : `${title} (copy ${n})`,
    slug: slugFor(n),
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requireAdminUser()
  if (authError) return authError

  const { id } = await params
  const supabase = createAdminClient()

  const { data: source, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single()
  if (fetchError || !source) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const copy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (!OMIT.has(key)) copy[key] = value
  }

  const { title, slug } = await copyTitleAndSlug(supabase, source.title, source.slug)
  const now = new Date().toISOString()
  const { data: created, error: insertError } = await supabase
    .from("posts")
    .insert({
      ...copy,
      title,
      slug,
      status: "draft",
      featured: false,
      is_hero: false,
      published_at: null,
      scheduled_at: null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single()
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Carry tags over to the new post.
  const { data: tags } = await supabase.from("post_tags").select("tag_id").eq("post_id", id)
  if (tags && tags.length > 0) {
    await supabase
      .from("post_tags")
      .insert(tags.map((t) => ({ post_id: created.id, tag_id: t.tag_id })))
  }

  return NextResponse.json({ id: created.id })
}
