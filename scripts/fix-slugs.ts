import ws from "ws"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { realtime: { transport: ws } })

async function main() {
  const { data: posts, error } = await sb.from("posts").select("id, slug")
  if (error) throw error

  let fixed = 0
  for (const post of posts ?? []) {
    const decoded = decodeURIComponent(post.slug)
    if (decoded !== post.slug) {
      // Check if decoded slug already exists to avoid unique conflict
      const { data: existing } = await sb.from("posts").select("id").eq("slug", decoded).maybeSingle()
      if (existing && existing.id !== post.id) {
        console.log(`  SKIP (conflict): ${decoded}`)
        continue
      }
      await sb.from("posts").update({ slug: decoded }).eq("id", post.id)
      console.log(`  Fixed: ${post.slug.slice(0, 40)}… → ${decoded.slice(0, 40)}…`)
      fixed++
    }
  }
  console.log(`\nDone. Fixed ${fixed} slugs.`)
}

main().catch(console.error)
