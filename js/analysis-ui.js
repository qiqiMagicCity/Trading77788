
/* Trading777 analysis-ui – v7.7.15
 * Render Total ＆ Intraday calendars once window.Calendars ready
 */

function waitForCalendars(timeout=10000){
  return new Promise((resolve, reject)=>{
     if(window.Calendars) return resolve(window.Calendars);
     let waited=0;
     const iv = setInterval(()=>{
        if(window.Calendars){
           clearInterval(iv);
           resolve(window.Calendars);
        }else if((waited+=200)>=timeout){
           clearInterval(iv);
           reject(new Error('Calendars not ready'));
        }
     },200);
  });
}

function buildEvents(calMap){
   return Object.entries(calMap).map(([date, pnl])=>{
       return {
          title: (pnl>=0?'+':'') + pnl.toFixed(2),
          start: date,
          allDay: true,
          backgroundColor: pnl>=0? '#22c55e': '#ef4444',
          borderColor: 'transparent'
       };
   });
}

function renderCalendar(containerId, calMap){
   const calendarEl = document.getElementById(containerId);
   if(!calendarEl) return;
   const calendar = new FullCalendar.Calendar(calendarEl, {
       initialView: 'dayGridMonth',
       height: 'auto',
       headerToolbar: {
           left: 'title',
           center: '',
           right: 'today prev,next'
       },
       events: buildEvents(calMap),
       eventClassNames: ['text-xs','font-semibold','text-white','px-1','rounded-md','overflow-hidden']
   });
   calendar.render();
}

waitForCalendars().then(({total,intraday})=>{
     renderCalendar('totalCalendar', total);
     renderCalendar('intraCalendar', intraday);
}).catch(err=>console.error(err));
