/** Sort key for storage files — prefers created_at, falls back to leading timestamp in filename. */
export function mediaSortKey(item: { name: string; created_at?: string | null }): number {
  if (item.created_at) {
    const parsed = Date.parse(item.created_at)
    if (!Number.isNaN(parsed)) return parsed
  }
  const match = item.name.match(/^(\d{13,})-/)
  return match ? Number(match[1]) : 0
}

export function sortMediaNewestFirst<T extends { name: string; created_at?: string | null }>(
  items: T[]
): T[] {
  return items.slice().sort((a, b) => {
    const diff = mediaSortKey(b) - mediaSortKey(a)
    if (diff !== 0) return diff
    return b.name.localeCompare(a.name)
  })
}
