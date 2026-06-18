import Image from "next/image"
import Link from "next/link"
import { getFeaturedPosts, getPublishedPosts, getCategorySpotlights } from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"
import { ArticleCard } from "@/components/article/ArticleCard"
import { Logo } from "@/components/Logo"
import type { PostWithRelations } from "@/types"

export const revalidate = 60

export default async function HomePage() {
  const featured = await getFeaturedPosts(4)
  const hero = featured[0] ?? null
  const sidebarPosts = featured.slice(1, 4)

  const heroIds = featured.map((p) => p.id)
  const [latest, spotlights] = await Promise.all([
    getPublishedPosts({ limit: 8, excludeIds: heroIds }),
    getCategorySpotlights(4),
  ])

  return (
    <div>
      {/* ── Hero split ── */}
      <section className="max-w-[1600px] mx-auto px-4 pt-6 pb-8">
        <div
          className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0 overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--border)" }}
        >
          {hero && <HeroCard post={hero} />}

          <div style={{ borderLeft: "1px solid var(--border)" }}>
            {/* Masthead */}
            <div className="px-6 py-7 flex flex-col gap-2" style={{
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)",
            }}>
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--fg-3)" }}>
                Keep the curiosity
              </p>
              <Logo size="lg" showTag={false} />
            </div>

            <div>
              {sidebarPosts.map((post, i) => (
                <SidebarCard key={post.id} post={post} last={i === sidebarPosts.length - 1} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest ── */}
      {latest.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 pb-16">
          <SectionLabel label="Latest" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* ── Category spotlights ── */}
      {spotlights.map(({ category, posts }) => (
        <section key={category.id} className="max-w-[1600px] mx-auto px-4 pb-16">
          <SectionLabel label={category.name} href={`/${category.slug}`} color={category.color ?? undefined} />

          {/* First post large, rest in a row */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6">
            {posts[0] && <ArticleCard post={posts[0]} />}
            {posts.slice(1).map((post) => (
              <ArticleCard key={post.id} post={post} variant="compact" />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function SectionLabel({ label, href, color }: { label: string; href?: string; color?: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {color && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {href ? (
        <Link
          href={href}
          className="text-xs font-bold tracking-[0.2em] uppercase hover:opacity-60 transition-opacity"
          style={{ color: "var(--fg-3)" }}
        >
          {label}
        </Link>
      ) : (
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "var(--fg-3)" }}>
          {label}
        </h2>
      )}
      <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
      {href && (
        <Link
          href={href}
          className="text-[10px] font-medium tracking-wider uppercase hover:opacity-60 transition-opacity"
          style={{ color: "var(--fg-3)" }}
        >
          See all →
        </Link>
      )}
    </div>
  )
}

function HeroCard({ post }: { post: PostWithRelations }) {
  const href = `/${post.category.slug}/${post.slug}`
  return (
    <Link href={href} className="group relative block overflow-hidden" style={{ minHeight: 520 }}>
      {post.cover_image_url ? (
        <Image
          src={post.cover_image_url}
          alt={post.cover_image_alt ?? post.title}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          priority
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "var(--bg-2)" }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <CategoryPill category={post.category} />
        <h2
          className="mt-3 text-3xl font-bold leading-tight text-white line-clamp-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {post.title}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {post.author.name} · {formatDate(post.published_at!)}
        </p>
      </div>
    </Link>
  )
}

function SidebarCard({ post, last }: { post: PostWithRelations; last: boolean }) {
  const href = `/${post.category.slug}/${post.slug}`
  return (
    <Link
      href={href}
      className="group flex gap-4 p-5 transition-colors"
      style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <CategoryPill category={post.category} small />
        <h3
          className="mt-2 text-base font-semibold leading-snug line-clamp-3 group-hover:opacity-70 transition-opacity"
          style={{ color: "var(--fg)" }}
        >
          {post.title}
        </h3>
        <p className="mt-1.5 text-xs" style={{ color: "var(--fg-3)" }}>
          {formatDate(post.published_at!)}
        </p>
      </div>
      {post.cover_image_url && (
        <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      )}
    </Link>
  )
}

function CategoryPill({ category, small }: { category: PostWithRelations["category"]; small?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wider text-black ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
      style={{ backgroundColor: category.color ?? "#e63946" }}
    >
      {category.name}
    </span>
  )
}
