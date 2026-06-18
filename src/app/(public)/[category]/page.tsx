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
    <div className="max-w-[1600px] mx-auto px-4 py-12">
      <header className="mb-10 pb-8" style={{ borderBottom: "1px solid var(--border)" }}>
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-black mb-4"
          style={{ backgroundColor: cat.color ?? "#e63946" }}
        >
          {cat.name}
        </span>
        <h1
          className="text-5xl font-black tracking-tighter"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          {cat.name}
        </h1>
        {cat.description && (
          <p className="mt-3 text-lg max-w-xl" style={{ color: "var(--fg-2)" }}>
            {cat.description}
          </p>
        )}
      </header>

      {posts.length === 0 ? (
        <p style={{ color: "var(--fg-3)" }}>No articles in this category yet.</p>
      ) : (
        <>
          {featured && (
            <div className="mb-10">
              <ArticleCard post={featured} variant="featured" />
            </div>
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
