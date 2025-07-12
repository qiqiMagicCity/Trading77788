/**
 * dateUtils.js – common NY time helpers (v0.1)
 * All scripts should import or reference these helpers instead of redefining.
 * Kept global-safe: attaches functions to window for legacy <script> inclusion.
 * Usage (module): import { nyNow, todayNY } from '../utils/dateUtils.js';
 */
const NY_TZ = 'America/New_York';
// luxon is expected to be loaded globally before this script
export const nyNow = () => luxon.DateTime.now().setZone(NY_TZ);
export const todayNY = () => nyNow().toISODate();
// Legacy global fallback
if (typeof window !== 'undefined') {
  window.NY_TZ = NY_TZ;
  window.nyNow = nyNow;
  window.todayNY = todayNY;
}