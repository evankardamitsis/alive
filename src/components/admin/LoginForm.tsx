"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { authRedirectPath } from "@/lib/site"

type Mode = "login" | "forgot" | "forgot-sent"

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    backgroundColor: "var(--bg-3)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/admin")
    router.refresh()
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectPath("/reset-password"),
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMode("forgot-sent")
  }

  if (mode === "forgot-sent") {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">📬</div>
        <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Check your email</p>
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>
          We sent a password reset link to <strong>{email}</strong>.
        </p>
        <button
          onClick={() => { setMode("login"); setError("") }}
          className="text-sm text-[#e63946] hover:underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleForgot} className="space-y-4">
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
            style={inputStyle}
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
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <button
          type="button"
          onClick={() => { setMode("login"); setError("") }}
          className="w-full text-sm text-center"
          style={{ color: "var(--fg-3)" }}
        >
          Back to sign in
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
          style={inputStyle}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>Password</label>
          <button
            type="button"
            onClick={() => { setMode("forgot"); setError("") }}
            className="text-xs hover:underline"
            style={{ color: "var(--fg-3)" }}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-colors"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--fg-3)" }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
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
