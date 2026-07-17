import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  getAuthorBySlug,
  getPostsByAuthor,
  getPublicAuthors,
} from "@/lib/supabase/queries"
import { ArticleCard } from "@/components/article/ArticleCard"
import { pageMetadata } from "@/lib/metadata"

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const authors = await getPublicAuthors()
  return authors.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) return {}
  const description =
    author.bio?.trim() ||
    `Άρθρα του/της ${author.name} στο Alive Magazine`
  return pageMetadata({
    title: author.name,
    description,
    path: `/author/${author.slug}`,
    og: {
      title: author.name,
      description,
      image: author.avatar_url,
      color: "#e63946",
    },
  })
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) notFound()

  const posts = await getPostsByAuthor(author.id)

  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-10">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-5"
            style={{ color: "var(--fg-3)" }}
          >
            Συγγραφέας
          </p>

          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
            {author.avatar_url ? (
              <Image
                src={author.avatar_url}
                alt={author.name}
                width={96}
                height={96}
                className="rounded-full object-cover shrink-0 w-20 h-20 sm:w-24 sm:h-24"
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center shrink-0 w-20 h-20 sm:w-24 sm:h-24 text-2xl font-bold text-white"
                style={{ backgroundColor: "#e63946" }}
              >
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h1
                className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
              >
                {author.name}
              </h1>
              {author.bio && (
                <p
                  className="mt-3 text-base sm:text-lg leading-relaxed max-w-2xl"
                  style={{ color: "var(--fg-2)" }}
                >
                  {author.bio}
                </p>
              )}
              <p
                className="mt-4 text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--fg-3)" }}
              >
                {posts.length} {posts.length === 1 ? "άρθρο" : "άρθρα"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 xl:px-12 py-8 pb-16">
        {posts.length === 0 ? (
          <p style={{ color: "var(--fg-3)" }}>Δεν υπάρχουν άρθρα ακόμα.</p>
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
