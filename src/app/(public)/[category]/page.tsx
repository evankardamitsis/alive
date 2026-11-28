import { Fragment } from "react"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import {
  getPublishedPosts,
  getAllCategories,
  getCategoryFeaturedPost,
  getPostBySlug,
  countPublishedPosts,
} from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"
import { pageMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/JsonLd"
import { getSiteUrl, siteUrl } from "@/lib/site"
import { getLivePromoBanners } from "@/lib/supabase/promo-banners"
import { PromoRails, PromoRow, inlineBannersFor } from "@/components/promo/PromoPlacements"
import { planListingPage } from "@/lib/promo-plan"

/** In-feed promo after every N grid cards (divisible by 1–4 columns so rows stay full). */
const PROMO_EVERY = 12
/** Page 1 shows the newest FIRST_PAGE_SIZE (plus a pinned featured post); later pages PAGE_SIZE each. */
const FIRST_PAGE_SIZE = 25
const PAGE_SIZE = 24

export const revalidate = 60

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/** Page number from ?page=, or null when the value is not a whole number ≥ 1. */
function parsePage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1
  const raw = Array.isArray(value) ? value[0] : value
  if (!/^\d+$/.test(raw)) return null
  const page = Number(raw)
  return page >= 1 ? page : null
}

function pageCount(total: number) {
  return 1 + Math.ceil(Math.max(0, total - FIRST_PAGE_SIZE) / PAGE_SIZE)
}

function pageHref(categorySlug: string, page: number) {
  return page <= 1 ? `/${categorySlug}` : `/${categorySlug}?page=${page}`
}

export async function generateStaticParams() {
  const categories = await getAllCategories()
  return categories.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category } = await params
  const categories = await getAllCategories()
  const cat = categories.find((c) => c.slug === category)
  if (!cat) return {}
  const page = parsePage((await searchParams).page) ?? 1
  const suffix = page > 1 ? ` — Σελίδα ${page}` : ""
  return pageMetadata({
    title: `${cat.name}${suffix}`,
    description: `${cat.description ?? `Όλα τα άρθρα στην ενότητα ${cat.name} — Alive Magazine`}${suffix}`,
    path: pageHref(cat.slug, page),
    og: {
      title: cat.name,
      description: cat.description ?? undefined,
      color: cat.color ?? "#e63946",
    },
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const categories = await getAllCategories()
  const cat = categories.find((c) => c.slug === category)
  if (!cat) {
    // Old WordPress permalinks were /<post-slug>/ — send them to the post's new address.
    const post = await getPostBySlug(decodeURIComponent(category))
    if (post) permanentRedirect(encodeURI(`/${post.category.slug}/${post.slug}`))
    notFound()
  }

  const page = parsePage((await searchParams).page)
  if (page === null) notFound()
  if (page === 1 && (await searchParams).page !== undefined) permanentRedirect(`/${cat.slug}`)

  const [featuredPost, recent, total, liveBanners] = await Promise.all([
    page === 1 ? getCategoryFeaturedPost(category) : Promise.resolve(null),
    getPublishedPosts({
      categorySlug: category,
      limit: page === 1 ? FIRST_PAGE_SIZE : PAGE_SIZE,
      offset: page === 1 ? 0 : FIRST_PAGE_SIZE + (page - 2) * PAGE_SIZE,
    }),
    countPublishedPosts({ categorySlug: category }),
    getLivePromoBanners(),
  ])
  const totalPages = pageCount(total)
  if (page > totalPages) notFound()
  const promos = planListingPage(inlineBannersFor(liveBanners, { type: "category", categoryId: cat.id }))

  const featured = page === 1 ? (featuredPost ?? recent[0] ?? null) : null
  const rest = recent.filter((p) => p.id !== featured?.id)
  const posts = featured ? [featured, ...rest] : rest
  const pageUrl = siteUrl(pageHref(cat.slug, page))
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
    <PromoRails left={promos.left} right={promos.right}>
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
            {total} {total === 1 ? "article" : "articles"}
            {page > 1 && ` · Σελίδα ${page} από ${totalPages}`}
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

            <PromoRow row={promos.feed[0]} className="mb-12" />

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rest.map((post, i) => {
                  const promoSlot = (i + 1) % PROMO_EVERY === 0 && i < rest.length - 1 ? (i + 1) / PROMO_EVERY : null
                  return (
                    <Fragment key={post.id}>
                      <ArticleCard post={post} />
                      {promoSlot !== null && <PromoRow row={promos.feed[promoSlot]} className="col-span-full" />}
                    </Fragment>
                  )
                })}
              </div>
            )}
          </>
        )}

        {totalPages > 1 && <Pagination categorySlug={cat.slug} page={page} totalPages={totalPages} />}
      </div>
    </PromoRails>
  )
}

function Pagination({ categorySlug, page, totalPages }: { categorySlug: string; page: number; totalPages: number }) {
  const linkStyle = { border: "1px solid var(--border)", color: "var(--fg)" }
  return (
    <nav aria-label="Σελίδες" className="mt-16 flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
      {page > 1 && (
        <Link href={pageHref(categorySlug, page - 1)} rel="prev" className="rounded-full px-4 py-2" style={linkStyle}>
          ← Νεότερα
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className="rounded-full px-4 py-2"
            style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}
          >
            {n}
          </span>
        ) : (
          <Link key={n} href={pageHref(categorySlug, n)} className="rounded-full px-4 py-2" style={linkStyle}>
            {n}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={pageHref(categorySlug, page + 1)} rel="next" className="rounded-full px-4 py-2" style={linkStyle}>
          Παλαιότερα →
        </Link>
      )}
    </nav>
  )
}
