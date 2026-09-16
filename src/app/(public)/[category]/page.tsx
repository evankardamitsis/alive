import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPublishedPosts, getAllCategories, getCategoryFeaturedPost } from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"
import { pageMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/JsonLd"
import { getSiteUrl, siteUrl } from "@/lib/site"

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
  return pageMetadata({
    title: cat.name,
    description: cat.description ?? `Όλα τα άρθρα στην ενότητα ${cat.name} — Alive Magazine`,
    path: `/${cat.slug}`,
    og: {
      title: cat.name,
      description: cat.description ?? undefined,
      color: cat.color ?? "#e63946",
    },
  })
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const categories = await getAllCategories()
  const cat = categories.find((c) => c.slug === category)
  if (!cat) notFound()

  const [featuredPost, recent] = await Promise.all([
    getCategoryFeaturedPost(category),
    getPublishedPosts({ categorySlug: category, limit: 26 }),
  ])

  const featured = featuredPost ?? recent[0] ?? null
  const rest = recent.filter((p) => p.id !== featured?.id)
  const posts = featured ? [featured, ...rest] : rest
  const pageUrl = siteUrl(`/${cat.slug}`)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}/#collection`,
        url: pageUrl,
        name: cat.name,
        description: cat.description ?? `Όλα τα άρθρα στην ενότητα ${cat.name} του Alive Magazine.`,
        inLanguage: "el-GR",
        isPartOf: { "@id": `${getSiteUrl()}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: post.title,
            url: siteUrl(`/${post.category.slug}/${post.slug}`),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Αρχική",
            item: getSiteUrl(),
          },
          { "@type": "ListItem", position: 2, name: cat.name, item: pageUrl },
        ],
      },
    ],
  }

  return (
    <div>
      <JsonLd data={jsonLd} />
      {/* ── Category header ── */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-8">
          <div
            className="inline-block w-10 h-1 rounded-full mb-5"
            style={{ backgroundColor: cat.color ?? "#e63946" }}
          />
          <h1
            className="text-3xl sm:text-4xl xl:text-6xl font-black tracking-tight leading-none"
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-8 pb-16">
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
