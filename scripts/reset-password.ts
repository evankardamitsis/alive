import { createClient } from "@supabase/supabase-js"
import ws from "ws"

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { realtime: { transport: ws } }
)

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  if (!email || !password) {
    console.error("Usage: pnpm exec tsx scripts/reset-password.ts <email> <newpassword>")
    process.exit(1)
  }

  const { data: { users } } = await s.auth.admin.listUsers()
  const user = users.find((u) => u.email === email)
  if (!user) { console.error(`No user: ${email}`); process.exit(1) }

  const { error } = await s.auth.admin.updateUserById(user.id, { password })
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`✓ Password updated for ${email}`)
}

main()
