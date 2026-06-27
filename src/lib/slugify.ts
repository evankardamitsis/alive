import slugify from "slugify"

/** URL slug from title or name — handles Greek via slugify locale. */
export function toSlug(text: string): string {
  const slug = slugify(text.trim(), { lower: true, strict: true, locale: "el" })
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return slug
}

/** Slug for posts — falls back when title transliterates to nothing. */
export function toPostSlug(title: string, manualSlug?: string): string {
  const fromManual = manualSlug?.trim() ? toSlug(manualSlug) : ""
  if (fromManual) return fromManual
  const fromTitle = toSlug(title)
  if (fromTitle) return fromTitle
  return `post-${Date.now()}`
}
