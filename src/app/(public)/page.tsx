import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { getHeroPost, getPublishedPosts, getCategorySpotlights } from "@/lib/supabase/queries"
import { formatDate, cleanExcerpt } from "@/lib/utils"
import { ArticleCard } from "@/components/article/ArticleCard"
import { Logo } from "@/components/Logo"
import {
  DEFAULT_DESCRIPTION,
  pageMetadata,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/metadata"
import type { PostWithRelations } from "@/types"

export async function generateMetadata(): Promise<Metadata> {
  const hero = (await getHeroPost()) ?? (await getPublishedPosts({ limit: 1 }))[0] ?? null

  if (hero) {
    const description = cleanExcerpt(hero.excerpt) || DEFAULT_DESCRIPTION
    return pageMetadata({
      description,
      path: "/",
      og: {
        title: hero.title,
        description,
        category: hero.category.name,
        color: hero.category.color,
        image: hero.cover_image_url,
      },
    })
  }

  return pageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    path: "/",
    og: { title: `${SITE_NAME} — ${SITE_TAGLINE}`, color: "#e63946" },
  })
}

export default async function HomePage() {
  const [heroPost, recentForSidebar] = await Promise.all([
    getHeroPost(),
    getPublishedPosts({ limit: 5 }),
  ])

  const hero = heroPost ?? recentForSidebar[0] ?? null
  const sidebarPosts = recentForSidebar
    .filter((p) => p.id !== hero?.id)
    .slice(0, 4)

  const excludeIds = [hero?.id, ...sidebarPosts.map((p) => p.id)].filter(Boolean) as string[]
  const [latest, spotlights] = await Promise.all([
    getPublishedPosts({ limit: 8, excludeIds }),
    getCategorySpotlights(5),
  ])

  return (
    <div>
      {/* ── Hero split ── */}
      <section className="max-w-[1600px] mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-6 sm:pb-8">
        <div
          className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0 overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--border)" }}
        >
          {hero && <HeroCard post={hero} />}

          <div
            className="lg:border-l border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Masthead — desktop only */}
            <div className="hidden lg:flex px-6 py-7 flex-col gap-2" style={{
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, var(--bg-3) 0%, var(--bg-2) 100%)",
            }}>
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--fg-3)" }}>
                Keep the curiosity
              </p>
              <Logo size="lg" showTag={false} />
            </div>

            {/* Sidebar cards — 2-col on mobile, stacked on desktop */}
            <div className="grid grid-cols-2 lg:block">
              {sidebarPosts.map((post, i) => (
                <SidebarCard key={post.id} post={post} last={i === sidebarPosts.length - 1} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest ── */}
      {latest.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-12">
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
        <section key={category.id} className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-12">
          <SectionLabel label={category.name} href={`/${category.slug}`} color={category.color ?? undefined} />

          {posts.length > 0 && (
            <>
              {/* Mobile: feature + 2×2 grid */}
              <div className="md:hidden">
                <Link
                  href={`/${posts[0].category.slug}/${posts[0].slug}`}
                  className="group relative block overflow-hidden rounded-2xl mb-4"
                  style={{ aspectRatio: "2/3" }}
                >
                  {posts[0].cover_image_url && (
                    <Image
                      src={posts[0].cover_image_url}
                      alt={posts[0].cover_image_alt ?? posts[0].title}
                      fill
                      sizes="(max-width: 639px) calc(100vw - 2rem), calc(100vw - 3rem)"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <CategoryPill category={posts[0].category} />
                    <h3
                      className="mt-2 text-xl font-bold leading-tight text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {posts[0].title}
                    </h3>
                    <p className="mt-1 text-xs text-white/60">
                      {formatDate(posts[0].published_at!)}
                    </p>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-4">
                  {posts.slice(1, 5).map((post) => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>
              </div>

              {/* Desktop: horizontal feature + 3-card row */}
              <div className="hidden md:block">
                <Link
                  href={`/${posts[0].category.slug}/${posts[0].slug}`}
                  className="group grid grid-cols-2 gap-6 mb-6 pb-6"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  {posts[0].cover_image_url && (
                    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
                      <Image
                        src={posts[0].cover_image_url}
                        alt={posts[0].cover_image_alt ?? posts[0].title}
                        fill
                        sizes="50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <CategoryPill category={posts[0].category} />
                    <h3
                      className="mt-4 text-2xl xl:text-3xl font-bold leading-tight group-hover:opacity-70 transition-opacity"
                      style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
                    >
                      {posts[0].title}
                    </h3>
                    {cleanExcerpt(posts[0].excerpt) && (
                      <p className="mt-3 text-sm leading-relaxed line-clamp-3" style={{ color: "var(--fg-2)" }}>
                        {cleanExcerpt(posts[0].excerpt)}
                      </p>
                    )}
                    <p className="mt-4 text-xs" style={{ color: "var(--fg-3)" }}>
                      {formatDate(posts[0].published_at!)}
                    </p>
                  </div>
                </Link>

                {posts.slice(1, 4).length > 0 && (
                  <div className="grid grid-cols-3 gap-6">
                    {posts.slice(1, 4).map((post) => (
                      <ArticleCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
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
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
        <CategoryPill category={post.category} />
        <h2
          className="mt-2 text-xl md:text-3xl font-bold leading-tight text-white line-clamp-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {post.title}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {formatDate(post.published_at!)}
        </p>
      </div>
    </Link>
  )
}

function SidebarCard({ post, last, index }: { post: PostWithRelations; last: boolean; index: number }) {
  const href = `/${post.category.slug}/${post.slug}`
  const isLeftCol = index % 2 === 0
  const isLastRow = index >= 2
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 p-4 transition-colors lg:flex-row lg:gap-4 lg:p-5 ${last ? "" : "lg:border-b"}`}
      style={{
        borderColor: "var(--border)",
        borderBottom: isLastRow ? "none" : "1px solid var(--border)",
        borderRight: isLeftCol ? "1px solid var(--border)" : "none",
      }}
    >
      {post.cover_image_url && (
        <div className="relative w-full aspect-[3/2] lg:w-20 lg:h-20 lg:aspect-auto rounded-lg overflow-hidden shrink-0">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            sizes="(max-width: 1024px) 50vw, 80px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <CategoryPill category={post.category} small />
        <h3
          className="mt-1.5 text-sm font-semibold leading-snug line-clamp-3 group-hover:opacity-70 transition-opacity"
          style={{ color: "var(--fg)" }}
        >
          {post.title}
        </h3>
        <p className="mt-1.5 text-xs" style={{ color: "var(--fg-3)" }}>
          {formatDate(post.published_at!)}
        </p>
      </div>

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
