import Image from "next/image"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import type { PostWithRelations } from "@/types"

interface ArticleCardProps {
  post: PostWithRelations
  variant?: "default" | "featured" | "compact"
}

export function ArticleCard({ post, variant = "default" }: ArticleCardProps) {
  const href = `/${post.category.slug}/${post.slug}`

  if (variant === "featured") {
    return (
      <Link href={href} className="group relative block overflow-hidden rounded-xl">
        <div className="aspect-[16/9] relative">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="h-full w-full bg-[#222]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <CategoryBadge category={post.category} />
          <h2 className="mt-2 text-2xl font-bold leading-snug text-white group-hover:text-neutral-200 transition-colors">
            {post.title}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {post.author.name} · {formatDate(post.published_at!)}
          </p>
        </div>
      </Link>
    )
  }

  if (variant === "compact") {
    return (
      <Link href={href} className="group flex gap-4 items-start">
        {post.cover_image_url && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            {post.category.name}
          </p>
          <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-neutral-300 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </div>
      </Link>
    )
  }

  // default card
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-4">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[#1a1a1a]" />
        )}
      </div>
      <CategoryBadge category={post.category} />
      <h3 className="mt-2 font-bold leading-snug text-white group-hover:text-neutral-300 transition-colors line-clamp-2">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{post.excerpt}</p>
      )}
      <p className="mt-2 text-xs text-neutral-600">
        {post.author.name} · {formatDate(post.published_at!)}
      </p>
    </Link>
  )
}

function CategoryBadge({ category }: { category: PostWithRelations["category"] }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-black"
      style={{ backgroundColor: category.color ?? "#e63946" }}
    >
      {category.name}
    </span>
  )
}
