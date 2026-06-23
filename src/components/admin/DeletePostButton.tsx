"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return
    setLoading(true)
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? "Failed to delete post.")
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-md hover:text-red-500 hover:bg-red-500/10 transition-colors"
      style={{ color: "var(--fg-3)" }}
    >
      <Trash2 size={13} />
    </button>
  )
}
