"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-red-50 hover:text-red-500"
      style={{ color: "var(--fg-3)" }}
    >
      <LogOut size={15} />
      Sign out
    </button>
  )
}
