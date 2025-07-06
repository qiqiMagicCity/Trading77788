
/* Trading777 analysis-ui – v7.7.16
 * Renders both Total & Intraday Calendars once window.Calendars is populated.
 * Requires FullCalendar & Tailwind.
 */
document.addEventListener('DOMContentLoaded', ()=>{
  const totalEl = document.getElementById('totalCalendar');
  const intraEl = document.getElementById('intraCalendar');

  /* wrapper to keep calendar scrollable on small screens */
  [totalEl, intraEl].forEach(el=>{
     if(el){ const wrapper = document.createElement('div');
             wrapper.className = 'overflow-x-auto sm:overflow-visible';
             el.parentNode.insertBefore(wrapper, el);
             wrapper.appendChild(el);
     }
  });

  function buildEvents(map){
     return Object.entries(map).map(([date,val])=>({
        title: (val>=0?'+':'')+val.toFixed(2),
        start: date,
        allDay: true,
        backgroundColor: val>=0? '#16a34a' : '#dc2626'
     }));
  }

  function render(calMap, el){
     const calendar = new FullCalendar.Calendar(el, {
        initialView: 'dayGridMonth',
        aspectRatio: 1.35,
        headerToolbar: {left:'title', center:'', right:'today prev,next'},
        events: buildEvents(calMap),
        eventDisplay: 'block',
        dayMaxEventRows: true,
        eventClassNames: 'text-xs font-semibold text-white px-1 rounded-md overflow-hidden'
     });
     calendar.render();
  }

  function ready(){
     const {total,intraday} = window.Calendars || {};
     if(total && intra){
        render(total, totalEl);
        render(intraday, intraEl);
     }
  }

  if(window.Calendars) ready();
  window.addEventListener('CalendarsReady', ready);
});
