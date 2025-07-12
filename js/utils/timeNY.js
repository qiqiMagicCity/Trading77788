// utils/timeNY.js
// Provides New York timezone helpers
// Generated 2025-07-12
import { DateTime } from 'https://cdn.skypack.dev/luxon@3.4.4';
const TZ = 'America/New_York';
export function nyNow() {
  return DateTime.now().setZone(TZ);
}
export function todayNY() {
  return nyNow().toISODate();
}
export function formatNY(dt, fmt='yyyy-LL-dd HH:mm:ss') {
  return DateTime.fromISO(dt, {zone: TZ}).toFormat(fmt);
}
