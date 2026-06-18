import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#e63946",
          borderRadius: 38,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 14,
          paddingBottom: 44,
          paddingLeft: 34,
          paddingRight: 34,
        }}
      >
        {[56, 90, 70].map((h, i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: h,
              background: "#ffffff",
              borderRadius: 11,
            }}
          />
        ))}
      </div>
    ),
    { ...size }
  )
}
