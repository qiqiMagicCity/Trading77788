
/**
 * safeNumber – Format a number for display, returning '--' if invalid, '0' for zero
 * @param {number} val
 * @returns {string}
 */
export function safeNumber(val){
  if(Number.isFinite(val)){
    return val === 0 ? '0' : val.toLocaleString();
  }
  return '--';
}
