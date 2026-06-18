import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#e63946",
          borderRadius: 7,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          paddingBottom: 7,
          paddingLeft: 6,
          paddingRight: 6,
        }}
      >
        {/* Equalizer bars — short, tall, medium */}
        {[10, 16, 12].map((h, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: h,
              background: "#ffffff",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    ),
    { ...size }
  )
}
