"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type OtpType = "invite" | "recovery" | "email" | "signup" | "email_change" | "magiclink"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function establishSession() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get("code")
      const tokenHash = url.searchParams.get("token_hash")
      const type = url.searchParams.get("type") as OtpType | null

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!mounted) return
        if (exchangeError) {
          setError(exchangeError.message)
          setChecking(false)
          return
        }
        window.history.replaceState({}, "", url.pathname)
        setReady(true)
        setChecking(false)
        return
      }

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        })
        if (!mounted) return
        if (verifyError) {
          setError(verifyError.message)
          setChecking(false)
          return
        }
        window.history.replaceState({}, "", url.pathname)
        setReady(true)
        setChecking(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session) {
        setReady(true)
        setChecking(false)
        return
      }

      setChecking(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")
      ) {
        setReady(true)
        setChecking(false)
        setError("")
      }
    })

    void establishSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match."); toast.error("Passwords don't match."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); toast.error("Password must be at least 8 characters."); return }
    setError("")
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError(updateError.message); toast.error(updateError.message); return }
    toast.success("Password updated")
    router.push("/admin")
    router.refresh()
  }

  const inputStyle = {
    backgroundColor: "var(--bg-3)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
  }

  if (checking) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--fg-3)" }}>
        Verifying reset link…
      </p>
    )
  }

  if (!ready) {
    return (
      <div className="space-y-3 text-center py-2">
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>
          {error || "This link is invalid or has expired."}
        </p>
        <a href="/admin/login" className="text-sm text-[#e63946] hover:underline">
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>New password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min. 8 characters"
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

      <div className="space-y-1">
        <label className="text-xs font-medium" style={{ color: "var(--fg-2)" }}>Confirm password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repeat password"
            className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-colors"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--fg-3)" }}
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
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
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  )
}
