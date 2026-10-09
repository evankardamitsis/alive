import type { Metadata } from "next"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { JsonLd } from "@/components/JsonLd"
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/metadata"
import { getSiteUrl, siteUrl } from "@/lib/site"
import { getAllCategories, getCategorySlugsWithContent } from "@/lib/supabase/queries"
import { getLivePromoBanners } from "@/lib/supabase/promo-banners"
import { isFullscreenFormat } from "@/lib/promo-banners"
import { PromoOverlays } from "@/components/promo/PromoOverlays"
import { PageviewTracker } from "@/components/analytics/PageviewTracker"

export const metadata: Metadata = {
  alternates: {
    types: { "application/rss+xml": siteUrl("/feed.xml") },
  },
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [banners, categories, sections] = await Promise.all([
    getLivePromoBanners(),
    getAllCategories().catch(() => []),
    getCategorySlugsWithContent(),
  ])
  const takeovers = banners.filter((b) => isFullscreenFormat(b.format))

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
      <Navbar sections={sections} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer sections={sections} />
      <PageviewTracker />
      {takeovers.length > 0 && (
        <PromoOverlays
          banners={takeovers}
          categories={categories.map(({ id, slug }) => ({ id, slug }))}
        />
      )}
    </>
  )
}
