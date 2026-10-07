// Browser-only helpers to shrink images before they are uploaded to storage.

/** Longest side we keep. Covers full-screen takeovers on 1080p/1440p screens and 2x mobile. */
const MAX_DIMENSION = 2560
const QUALITY = 0.82

/** Uploads go through a serverless route; keep well under the platform's request body limit. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export interface PreparedImage {
  file: File
  width: number
  height: number
  /** Size before compression, for the admin hint */
  originalBytes: number
}

function extFor(type: string) {
  if (type === "image/jpeg") return "jpg"
  if (type === "image/webp") return "webp"
  if (type === "image/gif") return "gif"
  if (type === "image/png") return "png"
  return "img"
}

function renamed(name: string, type: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image"
  return `${base}.${extFor(type)}`
}

/**
 * Downscale + re-encode a still image (JPG → JPG, PNG/WebP → WebP) when it saves bytes.
 * Animated GIFs are left untouched — re-encoding through a canvas would drop the animation.
 */
export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    bitmap.close()
    return { file, width, height, originalBytes: file.size }
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const outW = Math.round(width * scale)
  const outH = Math.round(height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return { file, width, height, originalBytes: file.size }
  }
  ctx.drawImage(bitmap, 0, 0, outW, outH)
  bitmap.close()

  const outType = file.type === "image/jpeg" ? "image/jpeg" : "image/webp"
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outType, QUALITY))

  // Keep the original if re-encoding didn't help (already well-optimised files).
  if (!blob || (scale === 1 && blob.size >= file.size)) {
    return { file, width, height, originalBytes: file.size }
  }

  return {
    file: new File([blob], renamed(file.name, outType), { type: outType }),
    width: outW,
    height: outH,
    originalBytes: file.size,
  }
}

/** Natural size of an already-hosted image (e.g. picked from the media library). */
export function measureImage(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
