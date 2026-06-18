import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "greek"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://alivemag.gr"),
  title: {
    default: "Alive Magazine — Keep the curiosity ALIVE",
    template: "%s | Alive Magazine",
  },
  description:
    "Το πρώτο community-first μουσικό blog στην Ελλάδα. Κριτικές, συνεντεύξεις, liveshows και πολιτισμός.",
  openGraph: {
    type: "website",
    locale: "el_GR",
    siteName: "Alive Magazine",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={`${inter.variable} ${playfair.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
