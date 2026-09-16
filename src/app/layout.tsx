import type { Metadata } from "next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { AppToaster } from "@/components/AppToaster"
import { inter, ibmPlex, urbanist } from "@/lib/fonts"
import { DEFAULT_DESCRIPTION, ogImageUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/metadata"
import { getSiteUrl } from "@/lib/site"
import "./globals.css"

const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`
const defaultOgImage = ogImageUrl({
  title: SITE_NAME,
  category: SITE_TAGLINE,
  color: "#e63946",
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Music and culture",
  keywords: [
    "μουσική",
    "μουσικά νέα",
    "συνεντεύξεις καλλιτεχνών",
    "κριτικές μουσικής",
    "live συναυλίες",
    "πολιτισμός",
    "ελληνική μουσική",
    "ανεξάρτητοι καλλιτέχνες",
  ],
  formatDetection: { email: false, address: false, telephone: false },
  verification: {
    google: "0ycjdsRC_noh-BwsM2cMYEFu5vd2G_eliRfKDSvn_FM",
    other: {
      "msvalidate.01": "70B9F550C57D7D0870923C21C617754D",
    },
  },
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
    <html
      lang="el"
      className={`${inter.variable} ${ibmPlex.variable} ${urbanist.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
      >
        <ThemeProvider>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
