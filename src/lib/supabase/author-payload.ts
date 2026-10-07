const ALLOWED_FIELDS = new Set([
  "name",
  "slug",
  "bio",
  "avatar_url",
  "email",
  "role",
  "social_links",
  "show_on_site",
])

/** Keep only editable author columns from editor/API input. */
export function pickAuthorFields(body: Record<string, unknown>) {
  const picked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) picked[key] = value
  }
  return picked
}
