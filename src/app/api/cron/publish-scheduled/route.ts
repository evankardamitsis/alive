import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or our own secret)
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: due, error } = await supabase
    .from("posts")
    .select("id, slug, category:categories(slug)")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due || due.length === 0) return NextResponse.json({ published: 0 })

  const { error: updateError } = await supabase
    .from("posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .in("id", due.map((p) => p.id))

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Revalidate affected pages
  revalidatePath("/")
  for (const post of due) {
    const catSlug = Array.isArray(post.category) ? post.category[0]?.slug : (post.category as any)?.slug
    if (catSlug) {
      revalidatePath(`/${catSlug}`)
      revalidatePath(`/${catSlug}/${post.slug}`)
    }
  }

  return NextResponse.json({ published: due.length, ids: due.map((p) => p.id) })
}
