import { createClient } from "@supabase/supabase-js"
import ws from "ws"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { realtime: { transport: ws } }
)

const email = process.argv[2]
if (!email) { console.error("Usage: pnpm exec tsx scripts/make-admin.ts <email>"); process.exit(1) }

async function main() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) { console.error(listError.message); process.exit(1) }

  const user = users.find((u) => u.email === email)
  if (!user) { console.error(`No user found with email: ${email}`); process.exit(1) }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { role: "admin" },
  })
  if (error) { console.error(error.message); process.exit(1) }

  console.log(`✓ ${email} is now an admin`)
}

main()
