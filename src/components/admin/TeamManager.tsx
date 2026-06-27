"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus, Trash2, ChevronDown } from "lucide-react"
import { SITE_LOCALE, SITE_TIMEZONE } from "@/lib/datetime"

interface Member {
  id: string
  email: string
  role: "admin" | "editor"
  created_at: string
  last_sign_in_at: string | null
}

interface Props {
  initial: Member[]
}

const ROLE_STYLES = {
  admin: "bg-[#e63946]/10 text-[#e63946]",
  editor: "bg-blue-500/10 text-blue-600",
}

function formatDate(iso: string | null) {
  if (!iso) return "Never"
  return new Intl.DateTimeFormat(SITE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SITE_TIMEZONE,
  }).format(new Date(iso))
}

export function TeamManager({ initial }: Props) {
  const router = useRouter()
  const [members, setMembers] = useState(initial)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "editor">("editor")
  const [inviting, setInviting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setInviting(true)
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    setInviting(false)
    if (!res.ok) {
      const data = await res.json()
      const message = data.error ?? "Something went wrong."
      if (/rate limit/i.test(message)) {
        setError(
          "Supabase email rate limit reached (usually clears within an hour). " +
            "Use the CLI instead: pnpm exec tsx --env-file=.env.local scripts/create-admin.ts email@example.com yourpassword editor"
        )
      } else {
        setError(message)
      }
      toast.error(message)
      return
    }
    const newMember = await res.json()
    setMembers((prev) => [...prev, { ...newMember, created_at: new Date().toISOString(), last_sign_in_at: null }])
    setInviteEmail("")
    setSent(true)
    toast.success(`Invite sent to ${inviteEmail}`)
    setTimeout(() => setSent(false), 4000)
  }

  async function handleRoleChange(id: string, role: "admin" | "editor") {
    const res = await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to update role")
      return
    }
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m))
    toast.success("Role updated")
  }

  async function handleRevoke(id: string, email: string) {
    if (!confirm(`Remove ${email} from the team?`)) return
    const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "Failed to remove member")
      return
    }
    setMembers((prev) => prev.filter((m) => m.id !== id))
    toast.success(`${email} removed from team`)
  }

  const inputStyle = {
    backgroundColor: "var(--bg-3)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Invite form */}
      <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--fg-2)" }}>Invite someone</h2>
        <form onSubmit={handleInvite} className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            placeholder="email@example.com"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none min-w-0"
            style={inputStyle}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "admin" | "editor")}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#e63946] text-white hover:bg-[#c9303d] transition-colors disabled:opacity-50 shrink-0"
          >
            <UserPlus size={14} />
            {inviting ? "Sending…" : sent ? "Sent ✓" : "Invite"}
          </button>
        </form>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs" style={{ color: "var(--fg-3)" }}>
          They&apos;ll receive an email to set their password. If email is rate-limited, use{" "}
          <code className="text-[11px]">scripts/create-admin.ts</code> from the project root instead.
        </p>
      </div>

      {/* Members list */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--fg-2)" }}>
          Team members ({members.length})
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {members.length === 0 && (
            <p className="py-10 text-center text-sm" style={{ color: "var(--fg-3)" }}>No team members yet.</p>
          )}
          {members.map((member, i) => (
            <div
              key={member.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{
                borderBottom: i < members.length - 1 ? "1px solid var(--border)" : undefined,
                backgroundColor: "var(--bg-2)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: member.role === "admin" ? "#e63946" : "#3b82f6" }}
              >
                {member.email[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{member.email}</p>
                <p className="text-xs" style={{ color: "var(--fg-3)" }}>
                  Last sign in: {formatDate(member.last_sign_in_at)}
                </p>
              </div>

              {/* Role selector */}
              <div className="relative">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as "admin" | "editor")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold appearance-none pr-6 outline-none cursor-pointer ${ROLE_STYLES[member.role]}`}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "currentColor" }} />
              </div>

              {/* Revoke */}
              <button
                onClick={() => handleRevoke(member.id, member.email)}
                className="p-1.5 rounded-md hover:text-red-500 hover:bg-red-500/10 transition-colors"
                style={{ color: "var(--fg-3)" }}
                title="Remove from team"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
