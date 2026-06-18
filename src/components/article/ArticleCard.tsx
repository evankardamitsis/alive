import Image from "next/image"
import Link from "next/link"
import { formatDate, cleanExcerpt } from "@/lib/utils"
import type { PostWithRelations } from "@/types"

interface ArticleCardProps {
  post: PostWithRelations
  variant?: "default" | "compact" | "featured"
}

export function ArticleCard({ post, variant = "default" }: ArticleCardProps) {
  const href = `/${post.category.slug}/${post.slug}`
  const excerpt = cleanExcerpt(post.excerpt)

  if (variant === "compact") {
    return (
      <Link href={href} className="group flex gap-3 items-start">
        {post.cover_image_url && (
          <div className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <CategoryPill category={post.category} small />
          <h3
            className="mt-1 text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity"
            style={{ color: "var(--fg)" }}
          >
            {post.title}
          </h3>
        </div>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Link href={href} className="group block">
        <div
          className="relative w-full overflow-hidden rounded-2xl mb-5 article-card-featured"
          style={{ backgroundColor: "var(--bg-2)" }}
        >
          {post.cover_image_url && (
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1600px) 90vw, 1440px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
            <CategoryPill category={post.category} />
            <h2
              className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {post.title}
            </h2>
            {excerpt && (
              <p className="mt-2 text-sm md:text-base text-white/75 line-clamp-2 max-w-2xl">
                {excerpt}
              </p>
            )}
            <p className="mt-3 text-xs text-white/60">
              {post.author.name} · {formatDate(post.published_at!)}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={href} className="group block">
      <div
        className="relative aspect-[3/2] overflow-hidden rounded-xl mb-3"
        style={{ backgroundColor: "var(--bg-2)" }}
      >
        {post.cover_image_url && (
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <CategoryPill category={post.category} small />
      <h3
        className="mt-2 font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity"
        style={{ color: "var(--fg)", fontFamily: "var(--font-display)" }}
      >
        {post.title}
      </h3>
      {excerpt && (
        <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--fg-2)" }}>
          {excerpt}
        </p>
      )}
      <p className="mt-2 text-xs" style={{ color: "var(--fg-3)" }}>
        {post.author.name} · {formatDate(post.published_at!)}
      </p>
    </Link>
  )
}

export function CategoryPill({
  category,
  small,
}: {
  category: PostWithRelations["category"]
  small?: boolean
}) {
  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wider text-black ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
      style={{ backgroundColor: category.color ?? "#e63946" }}
    >
      {category.name}
    </span>
  )
}
