import { Suspense } from "react"
import type { Metadata } from "next"
import { searchPosts } from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"
import { SearchInput } from "@/components/search/SearchInput"

export const metadata: Metadata = { title: "Search" }

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ""
  const results = query ? await searchPosts(query) : []

  return (
    <div className="max-w-[1600px] mx-auto px-6 xl:px-12 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-black tracking-tight mb-6"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          Search
        </h1>
        <div className="max-w-2xl">
          <Suspense>
            <SearchInput defaultValue={query} />
          </Suspense>
        </div>
      </div>

      {/* Results */}
      {query && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-8" style={{ color: "var(--fg-3)" }}>
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`}
          </p>

          {results.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <p className="text-base" style={{ color: "var(--fg-3)" }}>
          Start typing to search across all articles.
        </p>
      )}
    </div>
  )
}
