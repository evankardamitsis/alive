export const SITE_TIMEZONE = "Europe/Athens"
export const SITE_LOCALE = "el-GR"

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function getZonedParts(date: Date, timeZone = SITE_TIMEZONE): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0"

  const hour = get("hour")
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(hour === "24" ? "0" : hour),
    minute: Number(get("minute")),
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

/** UTC ISO string → value for `<input type="datetime-local">` in site timezone. */
export function toDateTimeLocalValue(iso: string | Date, timeZone = SITE_TIMEZONE): string {
  const p = getZonedParts(new Date(iso), timeZone)
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`
}

/** `<input type="datetime-local">` value (site timezone) → UTC ISO string. */
export function fromDateTimeLocalValue(value: string, timeZone = SITE_TIMEZONE): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) throw new Error("Invalid datetime-local value")

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  let utcMs = Date.UTC(year, month - 1, day, hour, minute)

  for (let i = 0; i < 10; i++) {
    const zoned = getZonedParts(new Date(utcMs), timeZone)
    const desired = Date.UTC(year, month - 1, day, hour, minute)
    const actual = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute)
    const diff = desired - actual
    if (diff === 0) break
    utcMs += diff
  }

  return new Date(utcMs).toISOString()
}

export function formatDate(date: string | Date, locale = SITE_LOCALE, timeZone = SITE_TIMEZONE) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date, locale = SITE_LOCALE, timeZone = SITE_TIMEZONE) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(date))
}

export function isFutureInSiteTimezone(value: string, timeZone = SITE_TIMEZONE): boolean {
  return new Date(fromDateTimeLocalValue(value, timeZone)) > new Date()
}

export function nowIso() {
  return new Date().toISOString()
}
