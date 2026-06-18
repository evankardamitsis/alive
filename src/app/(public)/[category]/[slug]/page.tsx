import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { getPostBySlug, getRelatedPosts, getAdjacentPosts } from "@/lib/supabase/queries"
import { formatDate, estimateReadTime, cleanExcerpt } from "@/lib/utils"
import { ArticleCard } from "@/components/article/ArticleCard"
import { CategoryPill } from "@/components/article/ArticleCard"
import { ReadingProgress } from "@/components/article/ReadingProgress"
import { ShareButtons } from "@/components/article/ShareButtons"

export const revalidate = false

interface Props {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: cleanExcerpt(post.excerpt) || undefined,
    openGraph: {
      title: post.title,
      description: cleanExcerpt(post.excerpt) || undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: [post.author.name],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug: rawSlug, category } = await params
  const slug = decodeURIComponent(rawSlug)
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const [related, adjacent] = await Promise.all([
    getRelatedPosts(post, 4),
    getAdjacentPosts(post),
  ])
  const readTime = estimateReadTime(post.content)
  const excerpt = cleanExcerpt(post.excerpt)
  const postUrl = `https://alivemag.gr/${category}/${slug}`

  return (
    <div>
      <ReadingProgress />

      {/* ── Split hero ── */}
      <div className="max-w-[1600px] mx-auto px-6 xl:px-12 pt-4">
        <div
          className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--border)", minHeight: 480 }}
        >
          {/* Left — title block */}
          <div
            className="flex flex-col justify-between p-8 xl:p-12"
            style={{ backgroundColor: "var(--bg-2)" }}
          >
            <div>
              <CategoryPill category={post.category} />
              <h1
                className="mt-5 text-3xl md:text-4xl xl:text-[2.75rem] font-bold leading-[1.08] tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
              >
                {post.title}
              </h1>
              {excerpt && (
                <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--fg-2)" }}>
                  {excerpt}
                </p>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
              <div className="flex items-center gap-3">
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
                  <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{post.author.name}</p>
                  <p className="text-xs" style={{ color: "var(--fg-3)" }}>
                    {formatDate(post.published_at!)} · {readTime} λεπτά ανάγνωση
                  </p>
                </div>
              </div>
              <ShareButtons title={post.title} url={postUrl} />
            </div>
          </div>

          {/* Right — image */}
          <div className="relative min-h-[320px] md:min-h-0">
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
      <div className="max-w-[1600px] mx-auto px-6 xl:px-12 pt-10 pb-20">
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">

          {/* Main column */}
          <div>
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
                  >
                    #{t.name}
                  </span>
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
                className="mt-10 pt-8 grid grid-cols-2 gap-6"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {adjacent.prev ? (
                  <Link href={`/${adjacent.prev.category.slug}/${adjacent.prev.slug}`} className="group">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--fg-3)" }}>
                      ← Προηγούμενο
                    </p>
                    <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity" style={{ color: "var(--fg)" }}>
                      {adjacent.prev.title}
                    </p>
                  </Link>
                ) : <div />}
                {adjacent.next && (
                  <Link href={`/${adjacent.next.category.slug}/${adjacent.next.slug}`} className="group text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--fg-3)" }}>
                      Επόμενο →
                    </p>
                    <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity" style={{ color: "var(--fg)" }}>
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
              <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-2)" }}>
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
                    <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{post.author.name}</p>
                    {post.author.bio && (
                      <p className="text-xs mt-1 line-clamp-3 leading-relaxed" style={{ color: "var(--fg-2)" }}>{post.author.bio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--fg-3)" }}>Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span key={t.id} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}>
                        #{t.name}
                      </span>
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
