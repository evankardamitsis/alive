"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Spotlight", href: "/spotlight" },
  { label: "Reviews", href: "/reviews" },
  { label: "Opinions", href: "/opinions" },
  { label: "Liveshows", href: "/liveshows" },
  { label: "Culture", href: "/culture" },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#222] bg-[#0d0d0d]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-black tracking-tight text-white">
          ALIVE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "text-white"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/search" aria-label="Search" className="text-neutral-400 hover:text-white transition-colors">
            <Search size={18} />
          </Link>
          <button
            className="md:hidden text-neutral-400 hover:text-white transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[#222] bg-[#0d0d0d] px-4 py-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm font-medium text-neutral-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
