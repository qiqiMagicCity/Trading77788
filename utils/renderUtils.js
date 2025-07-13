/**
 * safeNumber – Format a number for display, returning '—' if invalid
 * @param {number} val
 * @returns {string}
 */
export function safeNumber(val){
  return Number.isFinite(val) ? val.toLocaleString() : '—';
}