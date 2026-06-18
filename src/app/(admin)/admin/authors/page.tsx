import { createAdminClient } from "@/lib/supabase/admin"
import { AuthorManager } from "@/components/admin/AuthorManager"

export const revalidate = 0

export default async function AuthorsPage() {
  const supabase = createAdminClient()
  const { data: authors } = await supabase
    .from("authors")
    .select("id, name, slug, bio, avatar_url, email, role, social_links, created_at")
    .order("name")

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--fg)" }}>Authors</h1>
      <AuthorManager initial={authors ?? []} />
    </div>
  )
}
