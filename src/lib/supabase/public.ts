import { createClient } from "@supabase/supabase-js"

// Publishable key, no cookies — safe for build-time static generation
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
