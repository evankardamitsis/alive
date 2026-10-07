import { createAdminClient } from "@/lib/supabase/admin"
import { BannerManager } from "@/components/admin/BannerManager"
import type { PromoBanner } from "@/types"

export const revalidate = 0

export default async function BannersPage() {
  const supabase = createAdminClient()
  const [{ data: banners, error }, { data: categories }] = await Promise.all([
    supabase.from("promo_banners").select("*").order("starts_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug, color").order("name"),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Promo Banners</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>
          Visuals shown on the homepage and category pages: side rails on desktop, in the feed on mobile,
          or as full-screen takeovers.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-500">
          Could not load banners ({error.message}). Has the <code>0006_promo_banners</code> migration been applied?
        </p>
      ) : (
        <BannerManager initial={(banners ?? []) as PromoBanner[]} categories={categories ?? []} />
      )}
    </div>
  )
}
