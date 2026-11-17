import type { Metadata } from "next"
import { InternalVisitorMarker } from "@/components/analytics/InternalVisitorMarker"

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Staff open the login page first: keep their browser out of analytics from here on. */}
      <InternalVisitorMarker />
      {children}
    </>
  )
}
