import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#222] bg-[#0d0d0d]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-black tracking-tight">ALIVE</span>
            <p className="mt-2 text-sm text-neutral-500">
              Keep the curiosity ALIVE.
              <br />
              Το πρώτο community-first μουσικό blog στην Ελλάδα.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Sections
            </h3>
            <ul className="space-y-2">
              {["Spotlight", "Reviews", "Opinions", "Liveshows", "Culture"].map((s) => (
                <li key={s}>
                  <Link
                    href={`/${s.toLowerCase()}`}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              About
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Team", href: "/team" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Social
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Instagram", href: "https://instagram.com/alivemag.gr" },
                { label: "Facebook", href: "https://facebook.com/alivemag" },
                { label: "YouTube", href: "https://youtube.com/@alivemag" },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#222] pt-6 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} Alive Magazine. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
