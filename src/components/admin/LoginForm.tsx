"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    // TODO: wire up better-auth signIn
    // const result = await authClient.signIn.email({ email, password })
    // if (result.error) { setError(result.error.message); setLoading(false); return }
    // router.push("/admin")

    setError("Auth not configured yet. Wire up better-auth signIn.")
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg-3)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg-3)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#e63946] py-2.5 text-sm font-semibold text-white hover:bg-[#c9303d] transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
