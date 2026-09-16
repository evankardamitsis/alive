const PRODUCTION_SITE_URL = "https://alivemag.gr"

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_SITE_URL

  // Never emit localhost canonicals from a production build when a local
  // .env file is present. Preview/production URLs with real hosts still work.
  if (process.env.NODE_ENV === "production") {
    try {
      const hostname = new URL(configuredUrl).hostname
      if (hostname === "localhost" || hostname === "127.0.0.1") return PRODUCTION_SITE_URL
    } catch {
      return PRODUCTION_SITE_URL
    }
  }

  const url = configuredUrl
  return url.replace(/\/$/, "")
}

export function siteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}

export function authRedirectPath(path: string) {
  return siteUrl(path)
}
