import { createAdminClient } from "@/lib/supabase/admin"
import { CategoryManager } from "@/components/admin/CategoryManager"

export const revalidate = 0

export default async function CategoriesPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, color, description")
    .order("name")

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Categories</h1>
      <CategoryManager initial={categories ?? []} />
    </div>
  )
}
