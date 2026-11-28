import { NextResponse } from "next/server"
import { getPostPathByWpId } from "@/lib/supabase/queries"
import { siteUrl } from "@/lib/site"

// Old WordPress links (/?p=123) land here via the redirect in next.config.ts.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const wpId = Number(id)
  const path = Number.isInteger(wpId) && wpId > 0 ? await getPostPathByWpId(wpId) : null
  if (!path) return new NextResponse("Not found", { status: 404 })
  return NextResponse.redirect(siteUrl(encodeURI(path)), 308)
}
