/**
 * Exports logo as PNG at multiple sizes using sharp.
 * Run: npx tsx scripts/export-logo-png.ts
 *
 * Note: sharp renders SVG text with system fonts.
 * For pixel-perfect output matching the web font, open
 * public/logo.svg in a browser and export from there.
 */

import sharp from "sharp"
import fs from "fs"
import path from "path"

const pub = path.join(process.cwd(), "public")

const SVG_LIGHT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 180">
  <rect width="560" height="180" fill="#FAFAF8"/>
  <text x="0" y="132" font-family="Arial, Helvetica, sans-serif" font-weight="900"
    font-size="144" letter-spacing="-8" fill="#111111">alive</text>
  <text x="6" y="164" font-family="Arial, Helvetica, sans-serif" font-weight="400"
    font-size="20" letter-spacing="10" fill="#111111" opacity="0.4">magazine</text>
</svg>`

const SVG_DARK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 180">
  <rect width="560" height="180" fill="#0F0F0F"/>
  <text x="0" y="132" font-family="Arial, Helvetica, sans-serif" font-weight="900"
    font-size="144" letter-spacing="-8" fill="#F2F2F0">alive</text>
  <text x="6" y="164" font-family="Arial, Helvetica, sans-serif" font-weight="400"
    font-size="20" letter-spacing="10" fill="#F2F2F0" opacity="0.35">magazine</text>
</svg>`

const SVG_TRANSPARENT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 180">
  <text x="0" y="132" font-family="Arial, Helvetica, sans-serif" font-weight="900"
    font-size="144" letter-spacing="-8" fill="#111111">alive</text>
  <text x="6" y="164" font-family="Arial, Helvetica, sans-serif" font-weight="400"
    font-size="20" letter-spacing="10" fill="#111111" opacity="0.4">magazine</text>
</svg>`

async function exportPng(svg: string, filename: string, width: number) {
  await sharp(Buffer.from(svg))
    .resize(width)
    .png({ compressionLevel: 9 })
    .toFile(path.join(pub, filename))
  console.log(`✓ public/${filename}`)
}

async function main() {
  await exportPng(SVG_LIGHT,       "logo-light.png",      800)
  await exportPng(SVG_LIGHT,       "logo-light@2x.png",  1600)
  await exportPng(SVG_DARK,        "logo-dark.png",       800)
  await exportPng(SVG_DARK,        "logo-dark@2x.png",   1600)
  await exportPng(SVG_TRANSPARENT, "logo.png",            800)
  console.log("\nDone. Files are in /public/")
}

main().catch(console.error)
