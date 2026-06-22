import type { Metadata } from "next"
import Link from "next/link"
import { StaticPage } from "@/components/layout/StaticPage"
import { pageMetadata } from "@/lib/metadata"

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Επικοινωνήστε με την ομάδα του Alive Magazine.",
  path: "/contact",
  og: { title: "Contact — Alive Magazine", color: "#e63946" },
})

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com/alivemag.gr" },
  { label: "Facebook", href: "https://facebook.com/alivemag" },
  { label: "YouTube", href: "https://youtube.com/@alivemag" },
]

export default function ContactPage() {
  return (
    <StaticPage title="Contact">
      <p>
        Έχεις ιδέα, πρόταση συνεργασίας ή θέλεις να στείλεις υλικό για δημοσίευση;
        Επικοινώνησε μαζί μας — χαιρόμαστε να ακούμε τη μουσική κοινότητα.
      </p>

      <StaticPage.Section title="Email">
        <p>
          <a
            href="mailto:hello@alivemag.gr"
            className="font-semibold underline underline-offset-4 transition-opacity hover:opacity-60"
            style={{ color: "var(--fg)" }}
          >
            hello@alivemag.gr
          </a>
        </p>
      </StaticPage.Section>

      <StaticPage.Section title="Social">
        <ul className="space-y-2">
          {SOCIAL.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: "var(--fg)" }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </StaticPage.Section>

      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
        Για θέματα που αφορούν τα προσωπικά σου δεδομένα, δες την{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:opacity-60">
          Πολιτική Απορρήτου
        </Link>
        .
      </p>
    </StaticPage>
  )
}
