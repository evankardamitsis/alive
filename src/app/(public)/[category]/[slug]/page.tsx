import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import { getPostBySlug, getRelatedPosts } from "@/lib/supabase/queries"
import { formatDate, estimateReadTime } from "@/lib/utils"
import { ArticleCard } from "@/components/article/ArticleCard"

export const revalidate = false // static until revalidated on publish

interface Props {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
      type: "article",
      publishedTime: post.published_at ?? undefined,
      authors: [post.author.name],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post)
  const readTime = estimateReadTime(post.content)

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <header className="mb-10">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black mb-4"
          style={{ backgroundColor: post.category.color ?? "#e63946" }}
        >
          {post.category.name}
        </span>
        <h1 className="text-3xl font-black leading-tight text-white md:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-neutral-400 leading-relaxed">{post.excerpt}</p>
        )}
        <div className="mt-6 flex items-center gap-4 text-sm text-neutral-500">
          {post.author.avatar_url && (
            <Image
              src={post.author.avatar_url}
              alt={post.author.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span>{post.author.name}</span>
          <span>·</span>
          <span>{formatDate(post.published_at!)}</span>
          <span>·</span>
          <span>{readTime} min read</span>
        </div>
      </header>

      {/* Cover image */}
      {post.cover_image_url && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl mb-10">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-[#333] px-3 py-1 text-xs text-neutral-400"
            >
              #{t.name}
            </span>
          ))}
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {related.slice(0, 2).map((p) => (
              <ArticleCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
