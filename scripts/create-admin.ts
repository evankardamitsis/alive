/**
 * Create or update an admin/editor without sending email (bypasses Supabase rate limits).
 *
 * Run: pnpm exec tsx --env-file=.env.local scripts/create-admin.ts <email> <password> [admin|editor]
 */

import { createClient } from "@supabase/supabase-js"
import ws from "ws"

const email = process.argv[2]
const password = process.argv[3]
const role = (process.argv[4] ?? "editor") as "admin" | "editor"

if (!email || !password) {
  console.error(
    "Usage: pnpm exec tsx --env-file=.env.local scripts/create-admin.ts <email> <password> [admin|editor]"
  )
  process.exit(1)
}

if (role !== "admin" && role !== "editor") {
  console.error("Role must be admin or editor")
  process.exit(1)
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters")
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as never },
  }
)

async function main() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error(listError.message)
    process.exit(1)
  }

  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { role },
    })
    if (error) {
      console.error(error.message)
      process.exit(1)
    }
    console.log(`✓ Updated ${email} (${role}) — password set, no email sent`)
    console.log("  Sign in at /admin/login")
    return
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  })
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(`✓ Created ${email} (${role}) — no email sent`)
  console.log("  Sign in at /admin/login")
}

main()
