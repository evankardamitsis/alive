import { createHash } from "node:crypto"
import { after, userAgent, type NextRequest } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

// First-party, cookie-less analytics beacon (see supabase/migrations/0007_site_analytics.sql).
// Public on purpose: the site posts page views and promo impressions/clicks here.

const MAX_BODY_BYTES = 2048

const eventSchema = z.object({
  type: z.enum(["pageview", "impression", "click"]),
  // A path on this site, never the admin or API.
  path: z
    .string()
    .max(300)
    .regex(/^\/(?!\/)[^\s]*$/)
    .refine((p) => !/^\/(admin|api)(\/|$)/.test(p)),
  bannerId: z.uuid().optional(),
  placement: z.enum(["rail", "feed", "prestitial", "interstitial", "special_boost"]).optional(),
  referrer: z.string().max(500).optional(),
})

function athensDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(date)
}

/** Daily-rotating anonymous id: the same visitor gets a new hash every day and no IP is stored. */
function visitorHash(req: NextRequest, now: Date) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local"
  const ua = req.headers.get("user-agent") ?? ""
  const salt = process.env.ANALYTICS_SALT ?? process.env.SUPABASE_SECRET_KEY ?? ""
  return createHash("sha256").update(`${salt}|${athensDay(now)}|${ip}|${ua}`).digest("hex").slice(0, 32)
}

function referrerHost(referrer: string | undefined, siteHost: string | null) {
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "")
    // Moving between pages of the site is not a referral.
    return host && host !== siteHost?.replace(/^www\./, "") ? host : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const ua = userAgent(req)
  if (ua.isBot) return new Response(null, { status: 204 })

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response(null, { status: 400 })
  }
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return new Response(null, { status: 400 })
  const event = parsed.data
  if (event.type !== "pageview" && !event.bannerId) return new Response(null, { status: 400 })

  const now = new Date()
  const row = {
    type: event.type,
    path: event.path,
    banner_id: event.type === "pageview" ? null : event.bannerId,
    placement: event.type === "pageview" ? null : (event.placement ?? null),
    device: ua.device.type === "mobile" ? "mobile" : ua.device.type === "tablet" ? "tablet" : "desktop",
    visitor_hash: visitorHash(req, now),
    referrer_host: event.type === "pageview" ? referrerHost(event.referrer, req.nextUrl.hostname) : null,
  }

  // Respond straight away; the insert happens after the response is sent.
  after(async () => {
    const { error } = await createAdminClient().from("site_events").insert(row)
    if (error) console.error("Failed to record site event:", error.message)
  })

  return new Response(null, { status: 204 })
}
