"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, FileText, Image, Users, Tag, UsersRound, Menu, X, ExternalLink } from "lucide-react"
import { Logo } from "@/components/Logo"
import { SignOutButton } from "@/components/admin/SignOutButton"

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Posts", href: "/admin/posts", icon: FileText },
  { label: "Media", href: "/admin/media", icon: Image },
  { label: "Authors", href: "/admin/authors", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Team", href: "/admin/team", icon: UsersRound },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const navContent = (
    <>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {SIDEBAR_LINKS.map(({ label, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--fg)" : "var(--fg-2)",
                backgroundColor: active ? "var(--bg-3)" : "transparent",
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--fg-2)" }}
        >
          <ExternalLink size={15} />
          View site
        </a>
        <SignOutButton />
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex w-56 shrink-0 flex-col h-full"
        style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
      >
        <div className="flex h-14 items-center px-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <Logo size="sm" showTag={false} />
          <span className="ml-2 rounded bg-[#e63946] px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>
        </div>
        {navContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Logo size="sm" showTag={false} />
          <span className="rounded bg-[#e63946] px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: "var(--fg-2)" }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className="lg:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col w-64 transition-transform duration-200"
        style={{
          backgroundColor: "var(--bg-2)",
          borderRight: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Logo size="sm" showTag={false} />
            <span className="rounded bg-[#e63946] px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg" style={{ color: "var(--fg-3)" }}>
            <X size={18} />
          </button>
        </div>
        {navContent}
      </aside>
    </>
  )
}
