
(function(){
  const NY_TZ = 'America/New_York';
  // global data arrays
  window.trades = [];
  window.positions = [];
  function loadTrades(cb){
     const saved = localStorage.getItem('trades');
     if(saved){
        try{ window.trades = JSON.parse(saved) || []; }catch(e){console.error(e);}
        cb && cb();
     }else{
        fetch('data/trades.json').then(r=>r.json()).then(d=>{
            window.trades = Array.isArray(d)?d:(d.trades||[]);
            localStorage.setItem('trades', JSON.stringify(window.trades));
            cb && cb();
        }).catch(e=>{console.error('加载 trades.json 失败',e);});
     }
  }
  window.saveData = function(){
       localStorage.setItem('trades', JSON.stringify(window.trades));
  };

  document.addEventListener('DOMContentLoaded', ()=>{
      loadTrades(()=>{
          if(typeof recalcPositions==='function') recalcPositions();
          if(typeof renderStats==='function') renderStats();
          if(typeof renderPositions==='function') renderPositions();
          if(typeof renderTrades==='function') renderTrades();
          if(typeof renderSymbolsList==='function') renderSymbolsList?.();
      });
      // attach fab click via existing addTrade()
      const fab = document.getElementById('fab');
      if(fab && typeof addTrade==='function'){
         fab.addEventListener('click', addTrade);
      }
  });
})();
