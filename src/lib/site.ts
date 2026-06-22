export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alivemag.gr"
  return url.replace(/\/$/, "")
}

export function authRedirectPath(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}
