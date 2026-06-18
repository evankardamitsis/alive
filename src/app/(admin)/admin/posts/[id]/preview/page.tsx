import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { formatDate, estimateReadTime, cleanExcerpt } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export const revalidate = 0

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: post } = await supabase
    .from("posts")
    .select("*, author:authors(*), category:categories(*)")
    .eq("id", id)
    .single()

  if (!post) notFound()

  const readTime = estimateReadTime(post.content ?? "")
  const excerpt = cleanExcerpt(post.excerpt)

  return (
    <div data-theme="light" style={{ backgroundColor: "var(--bg)", minHeight: "100vh" }}>
      {/* Preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: "#e63946" }}>
        <span>PREVIEW — {post.status.toUpperCase()}</span>
        <Link href={`/admin/posts/${id}`} className="underline">← Back to editor</Link>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        {/* Category */}
        {post.category && (
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-black mb-4"
            style={{ backgroundColor: post.category.color ?? "#e63946" }}
          >
            {post.category.name}
          </span>
        )}

        {/* Title */}
        <h1
          className="text-3xl sm:text-4xl font-bold leading-tight mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <p className="text-sm mb-6" style={{ color: "var(--fg-3)" }}>
          {post.published_at ? formatDate(post.published_at) : "Unpublished"} · {readTime} λεπτά ανάγνωση
        </p>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="relative w-full rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: "16/9" }}>
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Excerpt */}
        {excerpt && (
          <p className="text-lg leading-relaxed mb-8 italic" style={{ color: "var(--fg-2)" }}>
            {excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
        />
      </div>
    </div>
  )
}
