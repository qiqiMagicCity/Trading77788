// Auto-generated Trading77788 v3
// File: js/utils/dateHelpers.js
// Date: 2025-07-12

export function toDate(str) { return new Date(str + 'T00:00:00-05:00'); } // NY assumed
export function format(d) { return d.toISOString().slice(0,10); }
export function startOfWeek(dateStr) {
  const d = toDate(dateStr);
  const day = d.getUTCDay(); // Sunday=0
  const diff = (day + 6) % 7; // distance to Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return format(d);
}
export function startOfMonth(dateStr) {
  const d = toDate(dateStr);
  d.setUTCDate(1);
  return format(d);
}
export function startOfYear(dateStr) {
  const d = toDate(dateStr);
  d.setUTCMonth(0); d.setUTCDate(1);
  return format(d);
}
