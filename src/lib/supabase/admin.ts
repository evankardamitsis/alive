import { createClient } from "@supabase/supabase-js"

// Bypasses RLS — server-only, never import in client components
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}
