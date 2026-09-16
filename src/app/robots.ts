import type { MetadataRoute } from "next"
import { getSiteUrl, siteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/og"],
      disallow: ["/admin/", "/api/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  }
}
