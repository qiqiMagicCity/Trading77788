/* Dynamically load symbol_name_map.json – v5.3.17 */
(async function(){
 try{
  const res = await fetch('./data/symbol_name_map.json?'+Date.now());
  const data = await res.json();
  window.SymbolCN = data;
 }catch(e){
  window.SymbolCN = window.SymbolCN || {};
 }
 // after mapping ready, refresh if functions exist
 if(typeof renderStats==='function') renderStats();
 if(typeof renderPositions==='function') renderPositions();
 if(typeof renderTrades==='function') renderTrades();
 if(typeof renderAll==='function') renderAll();
 if(typeof renderAllTrades==='function') renderAllTrades();
})();