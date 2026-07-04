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
