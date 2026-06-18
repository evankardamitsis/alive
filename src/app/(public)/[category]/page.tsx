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

  const posts = await getPublishedPosts({ categorySlug: category, limit: 12 })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-10">
        <span
          className="mb-2 inline-block h-1 w-12 rounded-full"
          style={{ backgroundColor: cat.color ?? "#e63946" }}
        />
        <h1 className="text-4xl font-black text-white">{cat.name}</h1>
        {cat.description && (
          <p className="mt-2 text-neutral-500">{cat.description}</p>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">No articles yet in this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
