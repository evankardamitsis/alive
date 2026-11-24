"use client"

import { Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function DuplicatePostButton({ id, variant = "icon" }: { id: string; variant?: "icon" | "button" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    const res = await fetch(`/api/admin/posts/${id}/duplicate`, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.id) {
      toast.error(data.error ?? "Failed to duplicate post.")
      setLoading(false)
      return
    }
    toast.success("Post duplicated as a draft")
    router.push(`/admin/posts/${data.id}`)
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={loading}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        style={{ color: "var(--fg-2)", border: "1px solid var(--border)" }}
      >
        <Copy size={14} />
        {loading ? "Duplicating…" : "Duplicate"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicate post"
      className="p-1.5 rounded-md hover:bg-[var(--bg-2)] transition-colors disabled:opacity-40"
      style={{ color: "var(--fg-3)" }}
    >
      <Copy size={13} />
    </button>
  )
}
