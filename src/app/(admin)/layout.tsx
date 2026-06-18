import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, Image, Users, Tag, LogOut } from "lucide-react"
import { Logo } from "@/components/Logo"

// TODO: replace with real session check from better-auth
async function getSession() {
  return null // will be wired up with better-auth middleware
}

const SIDEBAR_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Posts", href: "/admin/posts", icon: FileText },
  { label: "Media", href: "/admin/media", icon: Image },
  { label: "Authors", href: "/admin/authors", icon: Users },
  { label: "Categories", href: "/admin/categories", icon: Tag },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // const session = await getSession()
  // if (!session) redirect("/admin/login")

  return (
    <div data-theme="light" className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="flex w-56 shrink-0 flex-col"
        style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}
      >
        <div className="flex h-14 items-center px-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <Logo size="sm" showTag={false} />
          <span className="ml-2 rounded bg-[#e63946] px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {SIDEBAR_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: "var(--fg-2)" }}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
            style={{ color: "var(--fg-3)" }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
