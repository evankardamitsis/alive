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

      {/* Article header — narrow, centered */}
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-8">
        <div className="mb-6">
          <CategoryPill category={post.category} />
        </div>

        <h1
          className="text-4xl md:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          {post.title}
        </h1>

        {excerpt && (
          <p className="mt-5 text-lg md:text-xl leading-relaxed" style={{ color: "var(--fg-2)" }}>
            {excerpt}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {post.author.avatar_url && (
              <Image
                src={post.author.avatar_url}
                alt={post.author.name}
                width={36}
                height={36}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                {post.author.name}
              </p>
              <p className="text-xs" style={{ color: "var(--fg-3)" }}>
                {formatDate(post.published_at!)} · {readTime} λεπτά ανάγνωση
              </p>
            </div>
          </div>
          <ShareButtons title={post.title} url={postUrl} />
        </div>
      </div>

      {/* Cover image — wider */}
      {post.cover_image_url && (
        <div className="max-w-5xl mx-auto px-4 mb-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
              className="object-cover"
              priority
            />
          </div>
          {post.cover_image_alt && (
            <p className="mt-2 text-center text-xs" style={{ color: "var(--fg-3)" }}>
              {post.cover_image_alt}
            </p>
          )}
        </div>
      )}

      {/* Two-column layout on xl: body + sidebar */}
      <div className="max-w-[1100px] mx-auto px-4 pb-16">
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-16">
          {/* Main article body */}
          <div>
            <div
              className="article-content text-base md:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
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

            {/* Share row bottom */}
            <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--fg-3)" }}>
                Μοιράσου το
              </p>
              <ShareButtons title={post.title} url={postUrl} />
            </div>

            {/* Prev / Next */}
            {(adjacent.prev || adjacent.next) && (
              <div
                className="mt-10 grid grid-cols-2 gap-4"
                style={{ borderTop: "1px solid var(--border)", paddingTop: "2.5rem" }}
              >
                {adjacent.prev ? (
                  <Link
                    href={`/${adjacent.prev.category.slug}/${adjacent.prev.slug}`}
                    className="group col-start-1"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--fg-3)" }}>
                      ← Προηγούμενο
                    </p>
                    <p
                      className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity"
                      style={{ color: "var(--fg)", fontFamily: "var(--font-display)" }}
                    >
                      {adjacent.prev.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {adjacent.next && (
                  <Link
                    href={`/${adjacent.next.category.slug}/${adjacent.next.slug}`}
                    className="group col-start-2 text-right"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--fg-3)" }}>
                      Επόμενο →
                    </p>
                    <p
                      className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-60 transition-opacity"
                      style={{ color: "var(--fg)", fontFamily: "var(--font-display)" }}
                    >
                      {adjacent.next.title}
                    </p>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — hidden on mobile, sticky on xl */}
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-8">
              {/* Author card */}
              <div className="rounded-xl p-5" style={{ backgroundColor: "var(--bg-2)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--fg-3)" }}>
                  Ο συγγραφέας
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
                    <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
                      {post.author.name}
                    </p>
                    {post.author.bio && (
                      <p className="text-xs mt-0.5 line-clamp-3" style={{ color: "var(--fg-2)" }}>
                        {post.author.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--fg-3)" }}>
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
                      >
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
                  <div className="space-y-4">
                    {related.slice(0, 3).map((p) => (
                      <ArticleCard key={p.id} post={p} variant="compact" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related grid — mobile only (sidebar hidden on mobile) */}
        {related.length > 0 && (
          <section className="xl:hidden mt-12">
            <div className="my-8 h-px" style={{ backgroundColor: "var(--border)" }} />
            <h2
              className="text-xs font-bold uppercase tracking-[0.2em] mb-6"
              style={{ color: "var(--fg-3)" }}
            >
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
