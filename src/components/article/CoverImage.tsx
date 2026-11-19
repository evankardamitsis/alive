import Image from "next/image"

/**
 * A cover photo that is never cut off, whatever its shape. Fills a positioned frame (give the
 * parent `relative` and an aspect ratio): the whole photo is shown, and any space it leaves —
 * for square or upright photos in a landscape frame — is filled by a blurred copy of the same
 * photo. Both layers use the same URL, so the photo is downloaded once.
 */
export function CoverImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  /** extra classes for the sharp photo, e.g. a hover zoom */
  className?: string
}) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        priority={priority}
        className="scale-125 object-cover opacity-70 blur-2xl"
      />
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-contain ${className}`} />
    </>
  )
}
