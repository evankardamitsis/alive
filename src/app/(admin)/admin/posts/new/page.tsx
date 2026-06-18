import { createAdminClient } from "@/lib/supabase/admin"
import { PostEditor } from "@/components/admin/PostEditor"

export const revalidate = 0

export default async function NewPostPage() {
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .order("name")

  return <PostEditor categories={categories ?? []} />
}
