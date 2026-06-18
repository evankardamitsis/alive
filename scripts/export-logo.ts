import satori from "satori"
import sharp from "sharp"
import fs from "fs"
import path from "path"

const PUBLIC = path.join(process.cwd(), "public")
const LOGOS = path.join(PUBLIC, "logos")
fs.mkdirSync(LOGOS, { recursive: true })

async function fetchFont(): Promise<ArrayBuffer> {
  const cssUrl =
    "https://fonts.googleapis.com/css2?family=Urbanist:wght@900&display=swap"
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((r) => r.text())

  const match = css.match(/src: url\((.+?)\) format/)
  if (!match) throw new Error("Could not find font URL in Google Fonts CSS")
  const fontUrl = match[1]
  return fetch(fontUrl).then((r) => r.arrayBuffer())
}

async function makeSvg(
  fontData: ArrayBuffer,
  color: string,
  bg: string | null
) {
  return satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          ...(bg ? { backgroundColor: bg, padding: "48px 64px" } : { padding: "0" }),
        },
        children: [
          {
            type: "span",
            props: {
              style: {
                fontFamily: "Urbanist",
                fontWeight: 900,
                fontSize: 200,
                letterSpacing: "-12px",
                color,
                lineHeight: 1,
              },
              children: "alive",
            },
          },
        ],
      },
    },
    {
      width: bg ? 800 : 640,
      height: bg ? 296 : 200,
      fonts: [
        {
          name: "Urbanist",
          data: fontData,
          weight: 900,
          style: "normal",
        },
      ],
    }
  )
}

async function exportFiles(
  svg: string,
  name: string,
  sizes: number[]
) {
  // SVG
  const svgPath = path.join(LOGOS, `${name}.svg`)
  fs.writeFileSync(svgPath, svg)
  console.log(`✓ logos/${name}.svg`)

  // PNG at each size
  for (const w of sizes) {
    const suffix = w >= 1600 ? "@3x" : w >= 1200 ? "@2x" : ""
    const pngPath = path.join(LOGOS, `${name}${suffix}.png`)
    await sharp(Buffer.from(svg))
      .resize(w)
      .png({ compressionLevel: 9 })
      .toFile(pngPath)
    console.log(`✓ logos/${name}${suffix}.png (${w}px)`)
  }
}

async function main() {
  console.log("Fetching Urbanist Black from Google Fonts…")
  const font = await fetchFont()

  // Transparent background — dark text
  const svgTransparent = await makeSvg(font, "#111111", null)
  await exportFiles(svgTransparent, "alive-dark", [400, 800, 1600])

  // Transparent background — light text (for dark backgrounds)
  const svgLight = await makeSvg(font, "#F2F2F0", null)
  await exportFiles(svgLight, "alive-light", [400, 800, 1600])

  // On dark background
  const svgOnDark = await makeSvg(font, "#F2F2F0", "#0F0F0F")
  await exportFiles(svgOnDark, "alive-on-dark", [800, 1600])

  // On light background
  const svgOnLight = await makeSvg(font, "#111111", "#FAFAF8")
  await exportFiles(svgOnLight, "alive-on-light", [800, 1600])

  console.log("\nAll files saved to /public/logos/")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
