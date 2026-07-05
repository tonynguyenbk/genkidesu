// Day-boundary helpers anchored to the app timezone (Vietnam, UTC+7 by default),
// not the server's local timezone. This keeps "today" consistent between writing
// daily summaries and reading them, regardless of where the server runs.
//
// Override with APP_TZ_OFFSET_MINUTES if the deployment timezone changes.
const OFFSET_MIN = Number(process.env['APP_TZ_OFFSET_MINUTES'] ?? 420); // 7h
const OFFSET_MS = OFFSET_MIN * 60 * 1000;

// The app-timezone calendar date of an instant, as a UTC-midnight Date. Stored in
// a @db.Date column it yields the local calendar date (e.g. 2026-06-17), not the
// UTC date which can be the day before.
export function localDateKey(instant: Date): Date {
  const shifted = new Date(instant.getTime() + OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

// UTC instant bounds [start, end] of the app-timezone day that contains `instant`,
// for filtering `logged_at` (a timestamptz) on meal logs.
export function localDayRange(instant: Date): { start: Date; end: Date } {
  const key = localDateKey(instant);
  const start = new Date(key.getTime() - OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

// Hour-of-day (0-23) of an instant in the app timezone.
export function localHour(instant: Date): number {
  return new Date(instant.getTime() + OFFSET_MS).getUTCHours();
}
