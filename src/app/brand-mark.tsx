// The favicon / app icon: the "a" of the alive wordmark (traced from public/logos/alive-on-dark.svg),
// off-white on the logo's near-black square.

const A_GLYPH = "M149.2 127.6L147.8 118L177.8 118L177.8 218L147.7 218L146.3 209Q142.6 214.2 136.9 217.4Q131.3 220.6 123.8 220.6L123.8 220.6Q112.6 220.6 102.8 216.4Q93.1 212.2 85.7 204.8Q78.3 197.3 74.2 187.6Q70 177.8 70 166.6L70 166.6Q70 155.9 73.9 146.6Q77.8 137.3 84.8 130.3Q91.9 123.2 101.2 119.2Q110.4 115.2 121 115.2L121 115.2Q129.6 115.2 136.7 118.8Q143.7 122.3 149.2 127.6L149.2 127.6ZM123 191.8L123 191.8Q129.2 191.8 134.3 188.6Q139.4 185.4 142.4 180Q145.4 174.6 145.4 168L145.4 168Q145.4 161.4 142.4 156Q139.4 150.6 134.3 147.4Q129.2 144.2 123 144.2L123 144.2Q116.8 144.2 111.8 147.4Q106.7 150.6 103.8 156Q100.8 161.4 100.8 168L100.8 168Q100.8 174.6 103.8 180Q106.8 185.4 111.8 188.6Q116.9 191.8 123 191.8Z"

/** Renders the icon at the given pixel size, for next/og ImageResponse. */
export function BrandMark({ size, radius }: { size: number; radius: number }) {
  const glyph = Math.round(size * 0.62)
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#0F0F0F",
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={glyph} height={glyph} viewBox="66 112 116 112">
        <path d={A_GLYPH} fill="#F2F2F0" fillRule="evenodd" />
      </svg>
    </div>
  )
}
