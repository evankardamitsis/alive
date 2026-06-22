import type { Metadata } from "next"
import { absoluteUrl } from "@/lib/utils"

export const SITE_NAME = "Alive Magazine"
export const SITE_TAGLINE = "Keep the curiosity ALIVE"
export const DEFAULT_DESCRIPTION =
  "Το πρώτο community-first μουσικό blog στην Ελλάδα. Κριτικές, συνεντεύξεις, liveshows και πολιτισμός."

export function ogImageUrl(options: {
  title: string
  category?: string
  color?: string | null
  image?: string | null
}) {
  const params = new URLSearchParams({ title: options.title })
  if (options.category) params.set("category", options.category)
  if (options.color) params.set("color", options.color)
  if (options.image) params.set("image", options.image)
  return absoluteUrl(`/api/og?${params}`)
}

export function pageMetadata(options: {
  title?: string
  description?: string
  path?: string
  og?: {
    title: string
    description?: string
    category?: string
    color?: string | null
    image?: string | null
  }
  type?: "website" | "article"
  publishedTime?: string
}): Metadata {
  const description = options.description ?? DEFAULT_DESCRIPTION
  const pageUrl = options.path ? absoluteUrl(options.path) : absoluteUrl("/")
  const ogTitle = options.og?.title ?? options.title ?? SITE_NAME
  const ogDescription = options.og?.description ?? description
  const ogImage = ogImageUrl({
    title: ogTitle,
    category: options.og?.category,
    color: options.og?.color,
    image: options.og?.image,
  })

  return {
    ...(options.title ? { title: options.title } : {}),
    description,
    openGraph: {
      type: options.type ?? "website",
      title: ogTitle,
      description: ogDescription,
      url: pageUrl,
      siteName: SITE_NAME,
      locale: "el_GR",
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
      ...(options.type === "article" && options.publishedTime
        ? { publishedTime: options.publishedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    alternates: { canonical: pageUrl },
  }
}
