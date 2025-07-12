// utils/timeNY.js - unify NY timezone (generated 2025-07-12)
export const NY_TZ = 'America/New_York';
export const nyNow   = ()=> luxon.DateTime.now().setZone(NY_TZ);
export const todayNY = ()=> nyNow().toISODate();
