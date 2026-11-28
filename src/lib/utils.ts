import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { decode } from "he"
import { formatDate as formatDateAthens } from "@/lib/datetime"
import { siteUrl } from "@/lib/site"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale?: string) {
  return formatDateAthens(date, locale)
}

export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, "")
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / 200)
}

export function absoluteUrl(path: string) {
  return siteUrl(path)
}

export function wordCount(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .trim()

  return text ? text.split(/\s+/).length : 0
}

export function cleanExcerpt(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/\s*\[&hellip;\]/g, "")
    .replace(/\s*\[&#8230;\]/g, "")
    .replace(/\s*\[…\]/g, "")
    .replace(/\s*\[\.\.\.\]/g, "")
    .trim()
}

/** Excerpts shorter than this make weak search snippets; seoDescription pads them with the article text. */
export const MIN_SEO_DESCRIPTION_LENGTH = 70

/**
 * Meta description for search results: the excerpt, or the excerpt followed by the opening of
 * the article when the excerpt alone is too short (e.g. "Ilion Plus στις 5 Δεκεμβρίου").
 */
export function seoDescription(excerpt: string | null | undefined, content: string, maxLength = 160): string {
  const lead = articleDescription(excerpt, "", Number.MAX_SAFE_INTEGER)
  if (lead.length >= MIN_SEO_DESCRIPTION_LENGTH) return articleDescription(lead, "", maxLength)
  const body = articleDescription(null, content, Number.MAX_SAFE_INTEGER)
  // Skip the excerpt when it is just the article's first words (WordPress auto-excerpts).
  if (!lead || body.toLowerCase().startsWith(lead.toLowerCase())) return articleDescription(null, body, maxLength)
  const separator = /[.!;·…]$/.test(lead) ? " " : ". "
  return articleDescription(null, `${lead}${separator}${body}`, maxLength)
}

export function articleDescription(excerpt: string | null | undefined, content: string, maxLength = 160): string {
  const source = cleanExcerpt(excerpt) || content
  const plainText = decode(source.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()

  if (plainText.length <= maxLength) return plainText

  const shortened = plainText.slice(0, maxLength - 1)
  const lastSpace = shortened.lastIndexOf(" ")
  return `${shortened.slice(0, lastSpace > 100 ? lastSpace : undefined).trim()}…`
}
