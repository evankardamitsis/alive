import type { Metadata } from "next"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { JsonLd } from "@/components/JsonLd"
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/metadata"
import { getSiteUrl, siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  alternates: {
    types: { "application/rss+xml": siteUrl("/feed.xml") },
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = getSiteUrl()
  const organizationId = `${baseUrl}/#organization`
  const websiteId = `${baseUrl}/#website`
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: "Alive",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: siteUrl("/logos/alive-on-light@3x.png"),
        },
        description: DEFAULT_DESCRIPTION,
        email: "hello@alivemag.gr",
        sameAs: ["https://www.instagram.com/alivemusicmag/"],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: baseUrl,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "el-GR",
        publisher: { "@id": organizationId },
      },
    ],
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </>
  )
}
