import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get("title") ?? "Alive Magazine"
  const category = searchParams.get("category") ?? ""
  const categoryColor = searchParams.get("color") ?? "#e63946"
  const imageUrl = searchParams.get("image")

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0F0F0F",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "56px 64px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {category && (
            <div
              style={{
                display: "inline-flex",
                backgroundColor: categoryColor,
                color: "#000",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                padding: "5px 14px",
                borderRadius: "999px",
                width: "fit-content",
              }}
            >
              {category}
            </div>
          )}

          <div
            style={{
              fontSize: title.length > 60 ? "40px" : "52px",
              fontWeight: 800,
              color: "#F2F2F0",
              lineHeight: 1.1,
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 900,
                color: "#F2F2F0",
                letterSpacing: "-2px",
              }}
            >
              alive
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              alivemag.gr
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
