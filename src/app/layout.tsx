import type { Metadata } from "next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { AppToaster } from "@/components/AppToaster"
import { inter, ibmPlex, urbanist } from "@/lib/fonts"
import {
  DEFAULT_DESCRIPTION,
  ogImageUrl,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/metadata"
import "./globals.css"

const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`
const defaultOgImage = ogImageUrl({ title: SITE_NAME, category: SITE_TAGLINE, color: "#e63946" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://alivemag.gr"),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "el_GR",
    siteName: SITE_NAME,
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: [defaultOgImage],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={`${inter.variable} ${ibmPlex.variable} ${urbanist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
