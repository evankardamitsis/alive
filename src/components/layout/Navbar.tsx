"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Search, Sun, Moon, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

const NAV_LINKS = [
  { label: "Spotlight", href: "/spotlight" },
  { label: "Interviews", href: "/interviews" },
  { label: "Reviews", href: "/reviews" },
  { label: "Opinions", href: "/opinions" },
  { label: "Liveshows", href: "/liveshows" },
  { label: "Culture", href: "/culture" },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6 gap-8">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-xl font-black tracking-tighter"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          ALIVE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--bg)" : "var(--fg-2)",
                  backgroundColor: active ? "var(--fg)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="p-2 rounded-full transition-colors"
            style={{ color: "var(--fg-2)" }}
          >
            <Search size={17} />
          </Link>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--fg-2)" }}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          <button
            className="md:hidden p-2 rounded-full"
            style={{ color: "var(--fg-2)" }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-6 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm font-medium"
              style={{
                color: pathname.startsWith(link.href) ? "var(--fg)" : "var(--fg-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
