// Rewritten with luxon to unify timezone (NY)
import {DateTime} from 'https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js';
window.nyNow = function(){
  return DateTime.now().setZone('America/New_York');
};
window.lonNow = function(){
  return DateTime.now().setZone('Europe/Madrid');
};