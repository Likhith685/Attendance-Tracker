const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns true for real calendar dates in YYYY-MM-DD form (rejects 2024-02-30). */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Today's date (UTC) in YYYY-MM-DD form, optionally shifted by whole days. */
export function utcDateString(offsetDays = 0, now = new Date()) {
  const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/**
 * Clients send their local date, which can be up to a day ahead of UTC.
 * Anything later than "tomorrow in UTC" is treated as a future date.
 */
export function isFutureDate(value, now = new Date()) {
  return value > utcDateString(1, now);
}
