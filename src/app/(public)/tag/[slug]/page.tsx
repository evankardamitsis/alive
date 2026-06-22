import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTagBySlug, getPostsByTag, getAllTags } from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"
import { pageMetadata } from "@/lib/metadata"

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)
  if (!tag) return {}
  const title = `#${tag.name}`
  const description = `Όλα τα άρθρα με την ετικέτα #${tag.name} — Alive Magazine`
  return pageMetadata({
    title,
    description,
    path: `/tag/${tag.slug}`,
    og: { title, description, color: "#e63946" },
  })
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params
  const [tag, posts] = await Promise.all([getTagBySlug(slug), getPostsByTag(slug)])
  if (!tag) notFound()

  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--fg-3)" }}>Tag</p>
          <h1
            className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
          >
            #{tag.name}
          </h1>
          <p className="mt-3 text-xs font-medium uppercase tracking-widest" style={{ color: "var(--fg-3)" }}>
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-8 pb-16">
        {posts.length === 0 ? (
          <p style={{ color: "var(--fg-3)" }}>No articles with this tag yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
