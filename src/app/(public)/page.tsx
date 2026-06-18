import { Suspense } from "react"
import { getFeaturedPosts, getPublishedPosts, getAllCategories } from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"

export const revalidate = 60

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    getFeaturedPosts(1),
    getPublishedPosts({ limit: 9 }),
    getAllCategories(),
  ])

  const hero = featured[0] ?? latest[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Hero */}
      {hero && (
        <section className="mb-12">
          <ArticleCard post={hero} variant="featured" />
        </section>
      )}

      {/* Latest articles grid */}
      <section>
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Latest
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
