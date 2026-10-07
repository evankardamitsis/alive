/** A media object name must be a single filename: no folders, traversal or control characters. */
export function isValidMediaFilename(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name.length <= 255 &&
    name !== "." &&
    name !== ".." &&
    !/[/\\\x00-\x1f\x7f]/.test(name)
  )
}
