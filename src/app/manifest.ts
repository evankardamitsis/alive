import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alive Magazine",
    short_name: "Alive",
    description: "Το πρώτο community-first μουσικό blog στην Ελλάδα.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e63946",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
