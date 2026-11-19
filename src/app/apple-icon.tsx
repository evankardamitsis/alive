import { ImageResponse } from "next/og"
import { BrandMark } from "./brand-mark"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// Apple rounds the corners itself, so the square is drawn full-bleed.
export default function AppleIcon() {
  return new ImageResponse(<BrandMark size={180} radius={0} />, { ...size })
}
