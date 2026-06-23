type PostStatus = "draft" | "published" | "scheduled" | "archived"

const ALLOWED_FIELDS = new Set([
  "title",
  "slug",
  "excerpt",
  "content",
  "cover_image_url",
  "cover_image_alt",
  "status",
  "featured",
  "is_hero",
  "category_id",
  "published_at",
  "scheduled_at",
  "read_time_minutes",
])

function pickAllowed(body: Record<string, unknown>) {
  const picked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) picked[key] = value
  }
  return picked
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null
  return new Date(value).toISOString()
}

/** Normalize editor/API input before insert or update. */
export function normalizePostPayload(body: Record<string, unknown>) {
  const payload = pickAllowed(body)

  if ("read_time" in body && !("read_time_minutes" in payload)) {
    payload.read_time_minutes = body.read_time
  }

  if ("status" in body) {
    const status = body.status as PostStatus
    const scheduleDate =
      parseDate(body.scheduled_at) ??
      parseDate(body.published_at) ??
      parseDate(body.publish_date)

    if (status === "published") {
      payload.published_at = scheduleDate ?? new Date().toISOString()
      payload.scheduled_at = null
    } else if (status === "scheduled") {
      payload.scheduled_at = scheduleDate
      payload.published_at = null
    }
  }

  return payload
}

export async function resolveAuthorId(
  supabase: { from: (table: string) => any },
  email: string | undefined
): Promise<string | null> {
  if (email) {
    const { data } = await supabase
      .from("authors")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    if (data?.id) return data.id
  }

  const { data: fallback } = await supabase
    .from("authors")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return fallback?.id ?? null
}
