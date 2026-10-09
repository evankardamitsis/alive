import { z } from "zod"
import { revalidatePath, revalidateTag } from "next/cache"
import { PROMO_BANNERS_CACHE_TAG } from "@/lib/promo-banners"

const imageUrl = z.url({ protocol: /^https?$/, message: "Must be an http(s) image URL" })

// Absolute http(s) URL, or a path on this site ("/culture"). Rejects javascript:, data:, "//evil.com".
const destinationUrl = z
  .string()
  .trim()
  .min(1, "Destination URL is required")
  .refine(
    (v) => /^https?:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[^\s]*$/.test(v),
    "Use a full https:// URL or a site path starting with /"
  )

const dimension = z.number().int().positive().max(20000).nullable().optional().transform((v) => v ?? null)

const isoDate = z.iso.datetime({ offset: true, message: "Invalid date" })

const cap = z.number().int().positive().max(1_000_000_000).nullable().optional().transform((v) => v ?? null)

export const promoBannerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    image_url: imageUrl,
    image_width: dimension,
    image_height: dimension,
    mobile_image_url: imageUrl.nullable().optional().transform((v) => v ?? null),
    mobile_image_width: dimension,
    mobile_image_height: dimension,
    alt_text: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    destination_url: destinationUrl,
    format: z.enum(["standard", "interstitial", "prestitial", "special_boost"]),
    starts_at: isoDate,
    ends_at: isoDate,
    show_on_home: z.boolean(),
    category_scope: z.enum(["none", "all", "selected"]),
    category_ids: z.array(z.uuid()).default([]),
    article_scope: z.enum(["none", "all", "categories"]).default("none"),
    device: z.enum(["all", "desktop", "mobile"]).default("all"),
    placements: z
      .array(z.enum(["rail", "feed", "article", "sidebar", "after_article"]))
      .min(1, "Choose at least one placement")
      .default(["rail", "feed", "article", "sidebar", "after_article"])
      .transform((list) => [...new Set(list)]),
    max_impressions: cap,
    max_clicks: cap,
    priority: z.number().int().min(-100).max(100).default(0),
    weight: z.number().int().min(1).max(10).default(1),
    is_active: z.boolean().default(true),
  })
  .refine((b) => new Date(b.ends_at) > new Date(b.starts_at), {
    message: "End date must be after the start date",
    path: ["ends_at"],
  })
  .refine((b) => b.category_scope !== "selected" || b.category_ids.length > 0, {
    message: "Pick at least one category",
    path: ["category_ids"],
  })
  .refine((b) => b.article_scope !== "categories" || b.category_scope !== "none", {
    message: "“Articles in the categories above” needs category targeting (all or selected)",
    path: ["article_scope"],
  })
  .refine((b) => b.show_on_home || b.category_scope !== "none" || b.article_scope !== "none", {
    message: "Choose at least one page where the banner appears",
    path: ["show_on_home"],
  })
  .transform((b) => ({
    ...b,
    category_ids: b.category_scope === "selected" ? b.category_ids : [],
    mobile_image_width: b.mobile_image_url ? b.mobile_image_width : null,
    mobile_image_height: b.mobile_image_url ? b.mobile_image_height : null,
  }))

export type PromoBannerPayload = z.infer<typeof promoBannerSchema>

export function parsePromoBanner(
  body: unknown
): { data: PromoBannerPayload; error: null } | { data: null; error: string } {
  const result = promoBannerSchema.safeParse(body)
  if (result.success) return { data: result.data, error: null }
  const issue = result.error.issues[0]
  return { data: null, error: issue?.message ?? "Invalid banner" }
}

/** Bust public caches after a banner is created, changed or removed. */
export function revalidatePromoBanners() {
  revalidateTag(PROMO_BANNERS_CACHE_TAG, "max")
  revalidatePath("/", "layout")
}
