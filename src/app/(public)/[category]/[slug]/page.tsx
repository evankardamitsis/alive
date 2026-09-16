import { notFound, permanentRedirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { getPostBySlug, getRelatedPosts, getAdjacentPosts, getAllPublishedSlugs } from "@/lib/supabase/queries"
import { articleDescription, formatDate, estimateReadTime, wordCount } from "@/lib/utils"
import { normalizeArticleImages } from "@/lib/article-content"
import { pageMetadata, SITE_NAME } from "@/lib/metadata"
import { getSiteUrl, siteUrl } from "@/lib/site"
import { ArticleCard } from "@/components/article/ArticleCard"
import { CategoryPill } from "@/components/article/ArticleCard"
import { ReadingProgress } from "@/components/article/ReadingProgress"
import { ShareButtons } from "@/components/article/ShareButtons"
import { JsonLd } from "@/components/JsonLd"

export const revalidate = 60
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map((p) => ({ category: p.category.slug, slug: p.slug }))
}

interface Props {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const post = await getPostBySlug(slug)
  if (!post) return {}

  const description = articleDescription(post.excerpt, post.content) || undefined

  return pageMetadata({
    title: post.title,
    description,
    path: `/${post.category.slug}/${post.slug}`,
    type: "article",
    publishedTime: post.published_at ?? undefined,
    modifiedTime: post.updated_at ?? post.published_at ?? undefined,
    authors:
      post.author.show_on_site !== false
        ? [
            {
              name: post.author.name,
              url: siteUrl(`/author/${post.author.slug}`),
            },
          ]
        : [{ name: SITE_NAME, url: getSiteUrl() }],
    section: post.category.name,
    tags: post.tags.map((tag) => tag.name),
    og: {
      title: post.title,
      description,
      category: post.category.name,
      color: post.category.color ?? "#e63946",
      image: post.cover_image_url,
    },
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug: rawSlug, category } = await params
  const slug = decodeURIComponent(rawSlug)
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  if (category !== post.category.slug || slug !== post.slug) {
    permanentRedirect(`/${post.category.slug}/${post.slug}`)
  }

  const [related, adjacent] = await Promise.all([getRelatedPosts(post, 4), getAdjacentPosts(post)])
  const readTime = estimateReadTime(post.content)
  const excerpt = articleDescription(post.excerpt, post.content, 260)
  const postUrl = siteUrl(`/${post.category.slug}/${post.slug}`)
  const organizationId = `${getSiteUrl()}/#organization`
  const authorUrl = siteUrl(`/author/${post.author.slug}`)
  const authorSameAs = Object.values(post.author.social_links ?? {}).filter(
    (url): url is string => typeof url === "string" && /^https?:\/\//.test(url)
  )

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${postUrl}/#article`,
        headline: post.title,
        description: excerpt || undefined,
        url: postUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        datePublished: post.published_at,
        dateModified: post.updated_at ?? post.published_at,
        image: post.cover_image_url ? [post.cover_image_url] : undefined,
        thumbnailUrl: post.cover_image_url ?? undefined,
        author:
          post.author.show_on_site !== false
            ? {
                "@type": "Person",
                "@id": `${authorUrl}/#person`,
                name: post.author.name,
                url: authorUrl,
                sameAs: authorSameAs.length > 0 ? authorSameAs : undefined,
              }
            : { "@id": organizationId },
        publisher: { "@id": organizationId },
        articleSection: post.category.name,
        keywords: post.tags.map((tag) => tag.name).join(", ") || undefined,
        wordCount: wordCount(post.content),
        timeRequired: `PT${readTime}M`,
        isAccessibleForFree: true,
        inLanguage: "el-GR",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${postUrl}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Αρχική",
            item: getSiteUrl(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: post.category.name,
            item: siteUrl(`/${post.category.slug}`),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: postUrl,
          },
        ],
      },
    ],
  }

  return (
    <div>
      <JsonLd data={jsonLd} />
      <ReadingProgress />

      {/* ── Split hero ── */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 xl:px-12 pt-4">
        <div
          className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--border)", minHeight: 480 }}
        >
          {/* Left — title block */}
          <div className="flex flex-col justify-between p-5 md:p-8 xl:p-12" style={{ backgroundColor: "var(--bg-2)" }}>
            <div>
              <Link href={`/${post.category.slug}`} aria-label={`Περισσότερα από ${post.category.name}`}>
                <CategoryPill category={post.category} />
              </Link>
              <h1
                className="mt-4 text-2xl md:text-4xl xl:text-[2.75rem] font-bold leading-[1.1] tracking-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--fg)",
                }}
              >
                {post.title}
              </h1>
              {excerpt && (
                <p
                  className="mt-5 text-[1.05rem] md:text-xl xl:text-[1.35rem] leading-[1.55] font-medium tracking-[-0.01em]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--fg-2)",
                    maxWidth: "36em",
                  }}
                >
                  {excerpt}
                </p>
              )}
            </div>

            <div
              className="mt-8 flex items-center justify-between flex-wrap gap-3"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "1.5rem",
              }}
            >
              {post.author.show_on_site !== false ? (
                <div className="flex items-center gap-3">
                  <Link href={`/author/${post.author.slug}`} className="flex items-center gap-3 group">
                    {post.author.avatar_url && (
                      <Image
                        src={post.author.avatar_url}
                        alt={post.author.name}
                        width={32}
                        height={32}
                        className="rounded-full shrink-0"
                      />
                    )}
                    <div>
                      <p
                        className="text-sm font-semibold group-hover:underline underline-offset-2"
                        style={{ color: "var(--fg)" }}
                      >
                        {post.author.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--fg-3)" }}>
                        {formatDate(post.published_at!)} · {readTime} λεπτά ανάγνωση
                      </p>
                    </div>
                  </Link>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--fg-3)" }}>
                  {formatDate(post.published_at!)} · {readTime} λεπτά ανάγνωση
                </p>
              )}
              <ShareButtons title={post.title} url={postUrl} />
            </div>
          </div>

          {/* Right — image */}
          <div className="relative min-h-[260px] md:min-h-0">
            {post.cover_image_url ? (
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt ?? post.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                style={{ objectPosition: "center 20%" }}
                priority
              />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: "var(--bg-3)" }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Body + sidebar ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 pt-8 pb-16">
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
          {/* Main column */}
          <div>
            <div
              className="article-content"
              dangerouslySetInnerHTML={{
                __html: normalizeArticleImages(post.content),
              }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tag/${t.slug}`}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--fg-2)",
                    }}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Share footer */}
            <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--fg-3)" }}>
                Μοιράσου το
              </p>
              <ShareButtons title={post.title} url={postUrl} />
            </div>

            {/* Prev / Next */}
            {(adjacent.prev || adjacent.next) && (
              <div
                className="mt-10 pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {adjacent.prev ? (
                  <Link href={`/${adjacent.prev.category.slug}/${adjacent.prev.slug}`} className="group">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                      style={{ color: "var(--fg-3)" }}
                    >
                      ← Προηγούμενο
                    </p>
                    <p
                      className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity"
                      style={{ color: "var(--fg)" }}
                    >
                      {adjacent.prev.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {adjacent.next && (
                  <Link href={`/${adjacent.next.category.slug}/${adjacent.next.slug}`} className="group text-right">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Επόμενο →
                    </p>
                    <p
                      className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity"
                      style={{ color: "var(--fg)" }}
                    >
                      {adjacent.next.title}
                    </p>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-8">
              {/* Author */}
              {post.author.show_on_site !== false && (
                <Link
                  href={`/author/${post.author.slug}`}
                  className="rounded-2xl p-5 block transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--bg-2)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--fg-3)" }}>
                    Συγγραφέας
                  </p>
                  <div className="flex items-center gap-3">
                    {post.author.avatar_url && (
                      <Image
                        src={post.author.avatar_url}
                        alt={post.author.name}
                        width={44}
                        height={44}
                        className="rounded-full shrink-0"
                      />
                    )}
                    <div>
                      <p
                        className="font-semibold text-sm underline-offset-2 hover:underline"
                        style={{ color: "var(--fg)" }}
                      >
                        {post.author.name}
                      </p>
                      {post.author.bio && (
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--fg-2)" }}>
                          {post.author.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--fg-3)" }}>
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <Link
                        href={`/tag/${t.slug}`}
                        key={t.id}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--fg-2)",
                        }}
                      >
                        #{t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related */}
              {related.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "var(--fg-3)" }}>
                    Από {post.category.name}
                  </p>
                  <div className="space-y-5">
                    {related.slice(0, 3).map((p) => (
                      <ArticleCard key={p.id} post={p} variant="compact" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related — mobile only */}
        {related.length > 0 && (
          <section className="xl:hidden mt-16 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: "var(--fg-3)" }}>
              Περισσότερα από {post.category.name}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {related.slice(0, 2).map((p) => (
                <ArticleCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
