import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + Supabase auth
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // CSS-in-JS (Tailwind inline styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Supabase storage images + Google fonts
      "img-src 'self' data: blob: https://*.supabase.co https://fonts.gstatic.com",
      // Supabase API + auth
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
      // WP article embeds (YouTube, etc.)
      "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "obhhrhwglprpfpzahpwr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Extra: tell browsers not to index admin at all
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: "/admin/reset-password",
        destination: "/reset-password",
        permanent: false,
      },
      // ── Old WordPress URLs (the site moved off WordPress in June 2026) ──
      // /?p=123 → the imported post with that wp_id (looked up in app/wp/[id]).
      {
        source: "/",
        has: [{ type: "query", key: "p", value: "(?<wpId>\\d+)" }],
        destination: "/wp/:wpId",
        permanent: true,
      },
      // Date permalinks → bare slug, which app/(public)/[category] sends on to the post.
      { source: "/:y(\\d{4})/:m(\\d{2})/:d(\\d{2})/:slug", destination: "/:slug", permanent: true },
      { source: "/:y(\\d{4})/:m(\\d{2})/:slug", destination: "/:slug", permanent: true },
      { source: "/category/:slug", destination: "/:slug", permanent: true },
      { source: "/feed", destination: "/feed.xml", permanent: true },
    ]
  },
}

export default nextConfig
