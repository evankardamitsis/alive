import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminUser } from "@/lib/supabase/api-auth"

export async function GET() {
  const { error: authError } = await requireAdminUser(); if (authError) return authError
  const supabase = createAdminClient()
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = users
    .filter((u) => u.app_metadata?.role === "admin" || u.app_metadata?.role === "editor")
    .map((u) => ({
      id: u.id,
      email: u.email,
      role: u.app_metadata?.role as "admin" | "editor",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))

  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdminUser(); if (authError) return authError
  const { email, role } = await req.json()
  if (!email || !role) return NextResponse.json({ error: "Missing email or role" }, { status: 400 })

  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/reset-password`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Set role in app_metadata immediately after invite
  await supabase.auth.admin.updateUserById(data.user.id, {
    app_metadata: { role },
  })

  return NextResponse.json({ ok: true, id: data.user.id, email, role })
}
