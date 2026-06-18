import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "greek"],
  variable: "--font-sans",
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
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0d0d0d] text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  )
}
