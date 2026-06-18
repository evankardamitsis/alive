import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // existing WP images during migration
        protocol: "https",
        hostname: "alivemag.gr",
      },
    ],
  },
  async redirects() {
    return [
      // WP permalink pattern → new slugs
      // e.g. /2024/03/some-post/ → /[category]/some-post
      // Populated during migration with the full redirect map
    ]
  },
}

export default nextConfig
