
(function(){
  const NY_TZ = 'America/New_York';
  // global data arrays
  window.trades = [];
  window.positions = [];
  function loadTrades(cb){
     const saved = localStorage.getItem('trades');
     if(saved){
        try{ window.trades = JSON.parse(saved) || []; }catch(e){console.error(e);}
        try{ window.trades = JSON.parse(saved) || []; }catch(e){console.error(e);}
        
     }else{
        fetch('data/trades.json').then(r=>r.json()).then(d=>{
            window.trades = Array.isArray(d)?d:(d.trades||[]);
            localStorage.setItem('trades', JSON.stringify(window.trades));
            
         }).then(()=>{cb && cb();}).catch(e=>{console.error('加载 trades.json 失败',e);});
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


// --- Patch: always fetch and merge with localStorage ---
(function(){
   const LOCAL_KEY = 'trades';
   async function mergeRemoteTrades(){
       try{
         const remote = await fetch('data/trades.json').then(r=>r.json());
         const remoteArr = Array.isArray(remote)?remote:(remote.trades||[]);
         const localArr = JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');
         const merged = [...localArr];
         const ids = new Set(localArr.map(t=>t.id||t.time||JSON.stringify(t)));
         remoteArr.forEach(t=>{ const key=t.id||t.time||JSON.stringify(t); if(!ids.has(key)){merged.push(t);}});
         window.trades = merged;
         localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
       }catch(e){console.warn('无法拉取远程 trades.json',e);}
   }
   // 在应用启动后立即合并
   mergeRemoteTrades().then(()=>{ if(typeof recalcPositions==='function'){recalcPositions();}});
})();
