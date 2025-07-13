window.NY_TZ = -4;
window.LON_TZ = 1;

window.nyNow = function(){
  const d = new Date();
  return new Date(d.getTime() + (window.NY_TZ - d.getTimezoneOffset()/60)*3600000);
};
window.lonNow = function(){
  const d=new Date();
  return new Date(d.getTime() + (window.LON_TZ - d.getTimezoneOffset()/60)*3600000);
};

// return previous NY trading day (skip weekend)
function prevTradingDayNY(dateISO){
   const dt = luxon.DateTime.fromISO(dateISO,{zone:'America/New_York'});
   let d=dt.minus({days:1});
   while([6,7].includes(d.weekday)){ d=d.minus({days:1}); }
   return d.toISODate();
}
