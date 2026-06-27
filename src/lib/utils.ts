import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate as formatDateAthens } from "@/lib/datetime"

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
  return `${process.env.NEXT_PUBLIC_SITE_URL}${path}`
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
