import type { Metadata } from "next"
import Image from "next/image"
import { Check, ArrowUpRight, Plus } from "lucide-react"
import { pageMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/JsonLd"
import { getSiteUrl, siteUrl } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "Alive for Artists",
  description:
    "Το Alive είναι το hub που στηρίζει ανεξάρτητους καλλιτέχνες μέσα από στοχευμένες υπηρεσίες προβολής — για κάθε νέο release ή live.",
  path: "/for-artists",
  og: { title: "Alive for Artists", color: "#e63946" },
})

const OFFER_EMAIL = "hello@alivemag.gr"
const ACCENT = "#e63946"

function offerHref(subject: string) {
  return `mailto:${OFFER_EMAIL}?subject=${encodeURIComponent(`Alive for Artists — ${subject}`)}`
}

/* ── Data ───────────────────────────────────────────── */

type Pkg = {
  name: string
  featured?: boolean
  baseNote?: string
  items: string[]
  subject: string
}

const RELEASE_PACKAGES: Pkg[] = [
  {
    name: "Standard",
    subject: "Release / Standard",
    items: [
      "Κυκλοφορία νέου τραγουδιού μέσω trusted distributor",
      "Προώθηση σε Meta, YouTube & TikTok — στρατηγική, set up καμπάνιας, monitoring & reporting",
    ],
  },
  {
    name: "Premium",
    featured: true,
    baseNote: "Ό,τι περιλαμβάνει το Standard, συν:",
    subject: "Release / Premium",
    items: [
      "Προβολή στο alivemag.gr με δημοσίευση Δελτίου Τύπου",
      "Συνέντευξη στο alivemag.gr + featured content στη homepage για μία εβδομάδα",
    ],
  },
]

const LIVE_PACKAGES: Pkg[] = [
  {
    name: "Standard",
    subject: "Live / Standard",
    items: [
      "Προώθηση σε Meta, YouTube & TikTok — στρατηγική, set up καμπάνιας, monitoring & reporting",
      "Προβολή στο alivemag.gr με δημοσίευση Δελτίου Τύπου",
    ],
  },
  {
    name: "Premium",
    featured: true,
    baseNote: "Ό,τι περιλαμβάνει το Standard, συν:",
    subject: "Live / Premium",
    items: ["Συνέντευξη στο alivemag.gr + featured content στη homepage για μία εβδομάδα"],
  },
]

const COLLABORATORS = [
  { name: "Zuma", src: "/collaborators/zuma.png", href: "https://zumacom.gr/" },
  {
    name: "Formiggart",
    src: "/collaborators/formiggart.png",
    href: "https://formiggart.gr/",
  },
  {
    name: "Greece On Tour",
    src: "/collaborators/greece-on-tour.png",
    href: "https://www.greece-on-tour.eu/en-gb",
  },
  {
    name: "Rockwave",
    src: "/collaborators/rockwave.png",
    href: "https://rockwave.gr/",
  },
  {
    name: "Xlalala",
    src: "/collaborators/xlalala.png",
    href: "https://www.xlalala.gr/",
  },
]

type Artist = {
  name: string
  src?: string
  href?: string
}

const ARTISTS: Artist[] = [
  {
    name: "Δήμητρα Γαλάνη",
    src: "/artists/galani.jpg",
    href: "https://open.spotify.com/artist/3nV0kq59WJOJRLNWpFR1m6",
  },
  {
    name: "Guppy Fish",
    src: "/artists/guppy.jpeg",
    href: "https://open.spotify.com/artist/4sqss5faBke1GEY2IROHbO",
  },
  {
    name: "Erasmia Markidi",
    src: "/artists/erasmia.jpg",
    href: "https://open.spotify.com/artist/6yGCwFJ7PT2kBpIJoyv5nc",
  },
  {
    name: "Στέλιος Τσουκιάς",
    src: "/artists/stelios.jpg",
    href: "https://open.spotify.com/artist/19vBSkSuxHbDVdxcGTgZDW",
  },
]

/* ── Section heading ────────────────────────────────── */

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-8 sm:mb-10">
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
          {eyebrow}
        </p>
      )}
      <h2
        className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        {title}
      </h2>
    </div>
  )
}

/* ── Package card ───────────────────────────────────── */

function PackageCard({ pkg }: { pkg: Pkg }) {
  return (
    <div
      className="flex flex-col rounded-2xl p-6 sm:p-8 transition-shadow"
      style={{
        backgroundColor: pkg.featured ? "var(--bg)" : "var(--bg-2)",
        border: pkg.featured ? `1.5px solid ${ACCENT}` : "1px solid var(--border)",
        boxShadow: pkg.featured ? "0 20px 60px -30px rgba(230,57,70,0.45)" : "none",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          className="text-xl sm:text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          {pkg.name}
        </h3>
        {pkg.featured && (
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ backgroundColor: ACCENT, color: "#fff" }}
          >
            Most complete
          </span>
        )}
      </div>

      {pkg.baseNote && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--fg-2)" }}>
          <Plus size={14} style={{ color: ACCENT }} />
          {pkg.baseNote}
        </p>
      )}

      <ul className="mt-6 flex-1 space-y-4">
        {pkg.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: "color-mix(in srgb, " + ACCENT + " 14%, transparent)",
              }}
            >
              <Check size={13} strokeWidth={3} style={{ color: ACCENT }} />
            </span>
            <span className="text-[0.95rem] leading-relaxed" style={{ color: "var(--fg-2)" }}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={offerHref(pkg.subject)}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-90"
        style={
          pkg.featured
            ? { backgroundColor: ACCENT, color: "#fff" }
            : { backgroundColor: "var(--fg)", color: "var(--bg)" }
        }
      >
        Πάρε προσφορά
        <ArrowUpRight size={16} strokeWidth={2.5} />
      </a>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────── */

export default function ForArtistsPage() {
  const pageUrl = siteUrl("/for-artists")
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}/#service`,
    name: "Alive for Artists",
    url: pageUrl,
    description: "Υπηρεσίες προβολής για ανεξάρτητους καλλιτέχνες, νέες κυκλοφορίες και live εμφανίσεις.",
    areaServed: { "@type": "Country", name: "Greece" },
    availableLanguage: ["el", "en"],
    provider: { "@id": `${getSiteUrl()}/#organization` },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Alive for Artists packages",
      itemListElement: [...RELEASE_PACKAGES, ...LIVE_PACKAGES].map((pkg) => ({
        "@type": "Offer",
        name: pkg.subject,
        itemOffered: {
          "@type": "Service",
          name: pkg.name,
          description: pkg.items.join(" "),
        },
      })),
    },
  }

  return (
    <div>
      <JsonLd data={jsonLd} />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 85% 0%, color-mix(in srgb, " +
              ACCENT +
              " 16%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <div className="max-w-3xl">
            <p
              className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
              style={{
                border: `1px solid ${ACCENT}`,
                color: ACCENT,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
              Alive for Artists
            </p>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.02] tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              Στηρίζουμε ανεξάρτητους καλλιτέχνες
              <span style={{ color: ACCENT }}>.</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--fg-2)" }}>
              Το Alive είναι το hub που στηρίζει ανεξάρτητους καλλιτέχνες μέσα από στοχευμένες υπηρεσίες προβολής,
              βοηθώντας τη μουσική και τη φωνή τους να φτάσουν στο κοινό που τους ταιριάζει.
            </p>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--fg-2)" }}>
              Είτε θέλεις να προωθήσεις μια νέα κυκλοφορία, ένα επερχόμενο live ή συνολικά την online παρουσία σου, το
              Alive μπορεί να σε βοηθήσει να βγεις μπροστά.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#release"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-opacity hover:opacity-90"
                style={{ backgroundColor: ACCENT, color: "#fff" }}
              >
                Δες τα πακέτα
              </a>
              <a
                href="#who"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition-colors"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
              >
                Η ιστορία μας
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── New release packages ── */}
      <section id="release" className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 py-14 sm:py-16 scroll-mt-20">
        <SectionHeading eyebrow="Νέο Release" title="Διάλεξε πακέτο για νέο release" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {RELEASE_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.subject} pkg={pkg} />
          ))}
        </div>
      </section>

      {/* ── Live packages ── */}
      <section id="live" className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 py-14 sm:py-16 scroll-mt-20">
        <SectionHeading eyebrow="Live" title="Διάλεξε πακέτο για live" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {LIVE_PACKAGES.map((pkg) => (
            <PackageCard key={pkg.subject} pkg={pkg} />
          ))}
        </div>
      </section>

      {/* ── Collaborators ── */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 py-14 sm:py-16">
        <SectionHeading eyebrow="Meet our" title="Collaborators" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {COLLABORATORS.map((c) => (
            <a
              key={c.name}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center rounded-2xl p-6 sm:p-8 transition-all hover:-translate-y-1"
              style={{
                backgroundColor: "var(--bg-2)",
                border: "1px solid var(--border)",
              }}
            >
              <Image
                src={c.src}
                alt={c.name}
                width={240}
                height={180}
                className="h-20 w-auto max-w-full object-contain opacity-80 transition-opacity group-hover:opacity-100 sm:h-24"
              />
            </a>
          ))}
        </div>
      </section>

      {/* ── Artists ── */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 py-14 sm:py-16">
        <SectionHeading eyebrow="Trusted by" title="Artists" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {ARTISTS.map((artist) => {
            const inner = (
              <>
                <div
                  className="relative aspect-square w-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-3)" }}
                >
                  {artist.src ? (
                    <Image
                      src={artist.src}
                      alt={artist.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in srgb, " +
                          ACCENT +
                          " 22%, var(--bg-3)) 0%, var(--bg-3) 100%)",
                      }}
                    >
                      <span
                        className="text-5xl font-black"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--fg)",
                        }}
                      >
                        {artist.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-4">
                  <span
                    className="text-[0.95rem] font-bold tracking-tight"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--fg)",
                    }}
                  >
                    {artist.name}
                  </span>
                  {artist.href && (
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      style={{ color: "var(--fg-3)" }}
                    />
                  )}
                </div>
              </>
            )

            const cardClass = "group overflow-hidden rounded-2xl transition-all hover:-translate-y-1"
            const cardStyle = {
              backgroundColor: "var(--bg-2)",
              border: "1px solid var(--border)",
            }

            return artist.href ? (
              <a
                key={artist.name}
                href={artist.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
                style={cardStyle}
              >
                {inner}
              </a>
            ) : (
              <div key={artist.name} className={cardClass} style={cardStyle}>
                {inner}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Who is / Founder ── */}
      <section
        id="who"
        className="scroll-mt-20"
        style={{
          backgroundColor: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 py-16 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[280px_1fr] lg:gap-16">
            <div className="mx-auto w-full max-w-[280px]">
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl"
                style={{ border: "1px solid var(--border)" }}
              >
                <Image
                  src="/team/alexandra-kollia.jpeg"
                  alt="Αλεξάνδρα Κόλλια — Founder, Alive"
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                Η ιστορία μας
              </p>
              <blockquote
                className="text-xl leading-relaxed sm:text-2xl"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--fg)",
                  fontWeight: 500,
                }}
              >
                Μετά από περισσότερα από επτά χρόνια στον χώρο της μουσικής και των media, το Alive είναι για μένα κάτι
                πολύ περισσότερο από ένα ακόμη project. Είναι ένα όνειρο που παίρνει επιτέλους μορφή.
              </blockquote>
              <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--fg-2)" }}>
                Ήθελα να δημιουργήσω ένα hub που να στηρίζει ουσιαστικά τους ανεξάρτητους καλλιτέχνες, να τους δίνει
                χώρο να ακουστούν και να τους βοηθά να φτάσουν πιο κοντά στο κοινό τους.
              </p>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--fg-2)" }}>
                Αυτό είναι το όραμα του Alive — και μόλις ξεκινά.
              </p>
              <div className="mt-7">
                <p className="font-bold" style={{ color: "var(--fg)" }}>
                  Αλεξάνδρα Κόλλια
                </p>
                <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                  Founder, Alive
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 xl:px-12 py-20 sm:py-24">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20"
          style={{ backgroundColor: "var(--fg)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 120% at 50% 0%, color-mix(in srgb, " +
                ACCENT +
                " 55%, transparent) 0%, transparent 55%)",
            }}
          />
          <div className="relative">
            <h2
              className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--bg)" }}
            >
              Join the Alive community
            </h2>
            <p
              className="mx-auto mt-4 max-w-xl text-base"
              style={{
                color: "color-mix(in srgb, var(--bg) 70%, transparent)",
              }}
            >
              Γίνε μέρος της κοινότητας που φέρνει τη νέα μουσική μπροστά.
            </p>
            <a
              href="https://www.instagram.com/alivemusicmag/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT, color: "#fff" }}
            >
              Join the Alive community
              <ArrowUpRight size={17} strokeWidth={2.5} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
