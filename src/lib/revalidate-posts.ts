import { revalidatePath, revalidateTag } from "next/cache"

export const POSTS_CACHE_TAG = "posts"

/** Invalidate cached public pages after a post is created, updated, or deleted. */
export function revalidatePublishedPost(options?: {
  categorySlug?: string | null
  slug?: string | null
  previousCategorySlug?: string | null
  previousSlug?: string | null
}) {
  revalidateTag(POSTS_CACHE_TAG, "max")

  revalidatePath("/", "layout")
  revalidatePath("/feed.xml")
  revalidatePath("/sitemap.xml")

  const slugs = new Set<string>()
  if (options?.categorySlug) slugs.add(options.categorySlug)
  if (options?.previousCategorySlug) slugs.add(options.previousCategorySlug)

  for (const categorySlug of slugs) {
    revalidatePath(`/${categorySlug}`, "page")
    revalidatePath(`/${categorySlug}`, "layout")

    if (options?.slug && options.categorySlug === categorySlug) {
      revalidatePath(`/${categorySlug}/${options.slug}`, "page")
    }
    if (options?.previousSlug && options.previousCategorySlug === categorySlug) {
      revalidatePath(`/${categorySlug}/${options.previousSlug}`, "page")
    }
  }
}
