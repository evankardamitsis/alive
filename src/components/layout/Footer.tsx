import Link from "next/link"
import { Logo } from "@/components/Logo"

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-2)" }}>
      <div className="mx-auto max-w-[1600px] px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" />
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
              Το πρώτο community-first μουσικό blog στην Ελλάδα.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-3)" }}>
              Sections
            </h3>
            <ul className="space-y-2.5">
              {["Spotlight", "Interviews", "Reviews", "Opinions", "Liveshows", "Culture"].map((s) => (
                <li key={s}>
                  <Link
                    href={`/${s.toLowerCase()}`}
                    className="text-sm transition-opacity hover:opacity-50"
                    style={{ color: "var(--fg-2)" }}
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-3)" }}>
              About
            </h3>
            <ul className="space-y-2.5">
              {[{ label: "Team", href: "/team" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-opacity hover:opacity-50" style={{ color: "var(--fg-2)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fg-3)" }}>
              Follow
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "Instagram", href: "https://instagram.com/alivemag.gr" },
                { label: "Facebook", href: "https://facebook.com/alivemag" },
                { label: "YouTube", href: "https://youtube.com/@alivemag" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm transition-opacity hover:opacity-50" style={{ color: "var(--fg-2)" }}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-3)" }}>
          <span>© {new Date().getFullYear()} Alive Magazine</span>
          <span>Made in Greece 🇬🇷</span>
        </div>
      </div>
    </footer>
  )
}
