import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
  }

  const body = await req.json()
  const { slug, categorySlug } = body as { slug: string; categorySlug: string }

  revalidatePath(`/${categorySlug}/${slug}`)
  revalidatePath(`/${categorySlug}`)
  revalidatePath("/")

  return NextResponse.json({ revalidated: true, slug })
}
