"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Search, Sun, Moon } from "lucide-react"
import { useState, useEffect } from "react"
import { Logo } from "@/components/Logo"
import { SearchModal } from "@/components/search/SearchModal"

const NAV_LINKS = [
  { label: "Culture", href: "/culture", color: "#a8dadc" },
  { label: "Opinions", href: "/opinions", color: "#e9c46a" },
  { label: "Liveshows", href: "/liveshows", color: "#f4a261" },
  { label: "Reviews", href: "/reviews", color: "#2a9d8f" },
  { label: "Spotlight", href: "/spotlight", color: "#e63946" },
  { label: "Interviews", href: "/interviews", color: "#c77dff" },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Cmd+K to open search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 gap-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Logo size="md" showTag={false} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-1.5 px-3 py-2 rounded-full font-bold tracking-tight transition-all"
                  style={{
                    fontSize: "0.95rem",
                    color: active ? link.color : "var(--fg)",
                    backgroundColor: active ? "color-mix(in srgb, var(--fg) 12%, transparent)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = link.color; (e.currentTarget as HTMLElement).style.backgroundColor = "color-mix(in srgb, var(--fg) 12%, transparent)" } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "var(--fg)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" } }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{ backgroundColor: link.color }}
                  />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="p-2 rounded-full transition-colors"
              style={{ color: "var(--fg-2)" }}
            >
              <Search size={17} />
            </button>

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

            {/* Hamburger — animated */}
            <button
              className="md:hidden p-2 rounded-full flex flex-col justify-center items-center gap-[5px]"
              style={{ color: "var(--fg-2)", width: 36, height: 36 }}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span
                className="block h-[1.5px] w-[18px] rounded-full transition-all duration-300 origin-center"
                style={{
                  backgroundColor: "var(--fg)",
                  transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-[1.5px] w-[18px] rounded-full transition-all duration-300"
                style={{
                  backgroundColor: "var(--fg)",
                  opacity: open ? 0 : 1,
                  transform: open ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block h-[1.5px] w-[18px] rounded-full transition-all duration-300 origin-center"
                style={{
                  backgroundColor: "var(--fg)",
                  transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <div
        className="fixed inset-0 z-40 md:hidden flex flex-col"
        style={{
          backgroundColor: "var(--bg)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        {/* Top spacer (navbar height) */}
        <div className="h-16 shrink-0" />

        {/* Nav links */}
        <nav className="flex-1 flex flex-col justify-center px-8 gap-2 overflow-y-auto py-8">
          {NAV_LINKS.map((link, i) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-4 py-3 transition-opacity"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(12px)",
                  transition: `opacity 0.35s ease ${0.05 + i * 0.05}s, transform 0.35s ease ${0.05 + i * 0.05}s`,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: link.color }}
                />
                <span
                  className="font-black tracking-tight leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2rem, 8vw, 3.5rem)",
                    color: active ? link.color : "var(--fg)",
                    transition: "color 0.2s",
                  }}
                >
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom bar */}
        <div
          className="px-8 py-6 flex items-center justify-between"
          style={{
            borderTop: "1px solid var(--border)",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.35s ease 0.35s, transform 0.35s ease 0.35s",
          }}
        >
          <Logo size="sm" showTag={false} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setOpen(false); setSearchOpen(true) }}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full"
              style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
            >
              <Search size={14} />
              Search
            </button>
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full"
                style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
