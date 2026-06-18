import { createAdminClient } from "@/lib/supabase/admin"
import { TeamManager } from "@/components/admin/TeamManager"

export const revalidate = 0

export default async function TeamPage() {
  const supabase = createAdminClient()
  const { data: { users } } = await supabase.auth.admin.listUsers()

  const members = users
    .filter((u) => u.app_metadata?.role === "admin" || u.app_metadata?.role === "editor")
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      role: u.app_metadata?.role as "admin" | "editor",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--fg)" }}>Team</h1>
      <TeamManager initial={members} />
    </div>
  )
}
