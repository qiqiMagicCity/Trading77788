// Trading77788 v6 - timeNY.js generated 2025-07-12


import { DateTime } from 'luxon';
const TZ='America/New_York';
export function nowNY(){ return DateTime.now().setZone(TZ);}
export function toNY(dateStr){ return DateTime.fromISO(dateStr,{zone:TZ});}
export function todayStr(){return nowNY().toFormat('yyyy-MM-dd');}
export function isSameDay(a,b){ return toNY(a).toFormat('yyyy-MM-dd')===toNY(b).toFormat('yyyy-MM-dd');}
