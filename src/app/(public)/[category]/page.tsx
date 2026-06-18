import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublishedPosts, getAllCategories } from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"

export const revalidate = 60

interface Props {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  const categories = await getAllCategories()
  return categories.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categories = await getAllCategories()
  const cat = categories.find((c) => c.slug === category)
  if (!cat) return {}
  return { title: cat.name, description: cat.description ?? undefined }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const categories = await getAllCategories()
  const cat = categories.find((c) => c.slug === category)
  if (!cat) notFound()

  const posts = await getPublishedPosts({ categorySlug: category, limit: 25 })
  const [featured, ...rest] = posts

  return (
    <div>
      {/* ── Category header ── */}
      <div
        className="border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-[1600px] mx-auto px-6 xl:px-12 py-10">
          <div
            className="inline-block w-10 h-1 rounded-full mb-5"
            style={{ backgroundColor: cat.color ?? "#e63946" }}
          />
          <h1
            className="text-5xl xl:text-6xl font-black tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
          >
            {cat.name}
          </h1>
          {cat.description && (
            <p className="mt-3 text-lg max-w-xl" style={{ color: "var(--fg-2)" }}>
              {cat.description}
            </p>
          )}
          <p className="mt-4 text-xs font-medium uppercase tracking-widest" style={{ color: "var(--fg-3)" }}>
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </div>

      {/* ── Posts ── */}
      <div className="max-w-[1600px] mx-auto px-6 xl:px-12 py-10">
        {posts.length === 0 ? (
          <p style={{ color: "var(--fg-3)" }}>No articles in this category yet.</p>
        ) : (
          <>
            {/* Featured — split hero style */}
            {featured && (
              <div className="mb-12">
                <ArticleCard post={featured} variant="featured" />
              </div>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rest.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
