import { createAdminClient } from "@/lib/supabase/admin"
import { MediaManager } from "@/components/admin/MediaManager"

export const revalidate = 0

const PAGE_SIZE = 48 // multiple of grid columns (2/3/4/5/6)
const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i

async function listAll(
  supabase: ReturnType<typeof createAdminClient>,
  prefix: string
): Promise<{ name: string; path: string; size: number; created_at: string }[]> {
  const { data: files } = await supabase.storage
    .from("media")
    .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } })

  const results: { name: string; path: string; size: number; created_at: string }[] = []
  for (const f of files ?? []) {
    if (f.name === ".emptyFolderPlaceholder") continue
    const fullPath = prefix ? `${prefix}/${f.name}` : f.name
    if (f.metadata == null) {
      results.push(...await listAll(supabase, fullPath))
    } else if (IMAGE_RE.test(f.name)) {
      results.push({ name: f.name, path: fullPath, size: f.metadata?.size ?? 0, created_at: f.created_at ?? "" })
    }
  }
  return results
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page: pageParam, q } = await searchParams
  const query = q?.trim().toLowerCase() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const supabase = createAdminClient()
  const [allFiles, { data: { publicUrl: baseUrl } }] = await Promise.all([
    listAll(supabase, ""),
    Promise.resolve(supabase.storage.from("media").getPublicUrl("")),
  ])

  // Sort newest first (already sorted per-folder, but merge needs a re-sort)
  allFiles.sort((a, b) => b.created_at.localeCompare(a.created_at))

  const filtered = query
    ? allFiles.filter((f) => f.name.toLowerCase().includes(query))
    : allFiles

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const items = slice.map((f) => ({
    name: f.name,
    path: f.path,
    url: `${baseUrl}${f.path}`,
    size: f.size,
    created_at: f.created_at,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--fg)" }}>Media</h1>
      <MediaManager
        items={items}
        bucketBaseUrl={baseUrl}
        page={safePage}
        totalPages={totalPages}
        total={total}
        searchQuery={query}
      />
    </div>
  )
}
