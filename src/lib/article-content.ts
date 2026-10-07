const FULL_WIDTH_IMAGE_STYLE =
  "display:block;width:100%;height:auto;margin:1.75rem 0;clear:both;float:none"

/** Strip legacy float/width styles from inline images so text never wraps beside them. */
export function normalizeArticleImages(html: string): string {
  if (!html) return html

  return html.replace(/<img\b([^>]*)\/?>/gi, (_match, attrs: string) => {
    const src = attrs.match(/\bsrc="([^"]*)"/i)?.[1]
    if (!src) return _match

    const alt = attrs.match(/\balt="([^"]*)"/i)?.[1]
    const altAttr = alt !== undefined ? ` alt="${alt.replace(/"/g, "&quot;")}"` : ""

    return `<img src="${src.replace(/"/g, "&quot;")}"${altAttr} style="${FULL_WIDTH_IMAGE_STYLE}">`
  })
}

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr",
])

/**
 * Split article HTML into chunks so promo banners can sit between them: after the `first`-th
 * paragraph, then every `every` paragraphs. A paragraph is a top-level <p>, or a block of text
 * ended by a double line break (<br><br>) inside a top-level <p> — some articles are written
 * that way; there the <p> is closed before the banner and reopened after it. A <p> inside a
 * blockquote or list never counts. No split is made unless at least `minAfter` paragraphs
 * follow, so a banner never lands at the very end. Unbalanced markup stays in one chunk.
 */
export function splitArticleForPromos(
  html: string,
  { first = 3, every = 6, minAfter = 2 }: { first?: number; every?: number; minAfter?: number } = {}
): string[] {
  if (!html) return [html]

  // Cut at `at`, continue from `resume` (they differ for a <br><br>, which is dropped at the cut).
  type Boundary = { at: number; resume: number; reopen: string | null }
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g
  const boundaries: Boundary[] = []
  let depth = 0
  let openP: string | null = null // opening tag of the current top-level <p>
  let lastBrEnd = -1 // end of a <br> directly inside the top-level <p>
  let lastBrStart = -1

  for (let m = tagRe.exec(html); m; m = tagRe.exec(html)) {
    const [tag, closing, rawName, selfClosing] = m
    if (!rawName) continue // comment
    const name = rawName.toLowerCase()
    const end = m.index + tag.length

    if (name === "br") {
      if (depth === 1 && openP) {
        const between = html.slice(lastBrEnd, m.index)
        if (lastBrEnd >= 0 && /^(\s|&nbsp;)*$/.test(between)) {
          boundaries.push({ at: lastBrStart, resume: end, reopen: openP })
          lastBrEnd = -1
        } else {
          lastBrEnd = end
          lastBrStart = m.index
        }
      }
      continue
    }
    if (VOID_TAGS.has(name) || selfClosing) continue
    lastBrEnd = -1

    if (closing) {
      depth -= 1
      if (depth < 0) return [html] // unbalanced: don't risk cutting it
      if (depth === 0 && name === "p") {
        // A double break right before </p> isn't a paragraph of its own.
        const last = boundaries[boundaries.length - 1]
        if (last?.reopen && !html.slice(last.resume, m.index).trim()) boundaries.pop()
        boundaries.push({ at: end, resume: end, reopen: null })
        openP = null
      }
    } else {
      if (depth === 0) openP = name === "p" ? tag : null
      depth += 1
    }
  }
  if (depth !== 0) return [html]

  const cuts: Boundary[] = []
  for (let n = first; n <= boundaries.length - minAfter; n += every) cuts.push(boundaries[n - 1])

  const chunks: string[] = []
  let start = 0
  let prefix = ""
  for (const cut of cuts) {
    chunks.push(prefix + html.slice(start, cut.at) + (cut.reopen ? "</p>" : ""))
    start = cut.resume
    prefix = cut.reopen ?? ""
  }
  chunks.push(prefix + html.slice(start))
  return chunks
}
