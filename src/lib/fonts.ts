import { Inter, IBM_Plex_Sans, Urbanist } from "next/font/google"

export const inter = Inter({
  subsets: ["latin", "greek"],
  variable: "--font-inter",
  display: "swap",
})

export const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin", "greek"],
  variable: "--font-display-sans",
  display: "swap",
})

export const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: "900",
})
