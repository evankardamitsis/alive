import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_PATHS = ["/admin/login", "/admin/reset-password"]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  // Not logged in
  if (!user) {
    if (isPublicPath) return response
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // Logged in but not an admin/editor — clear session and bounce
  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin" && role !== "editor") {
    const url = new URL("/admin/login?error=unauthorized", request.url)
    const res = NextResponse.redirect(url)
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-")) res.cookies.set(name, "", { maxAge: 0, path: "/" })
    })
    return res
  }

  // Authorised user hitting login page — send to dashboard
  if (isPublicPath) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
