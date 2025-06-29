
const STORAGE_KEY='trading777_v05';
function loadTrades(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch(e){return [];}}
function saveTrades(arr){localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));}
function addTrade(t){const a=loadTrades();a.push(t);saveTrades(a);}
function deleteTrade(index){const a=loadTrades();a.splice(index,1);saveTrades(a);}
function importJSON(file,cb){const r=new FileReader();r.onload=e=>{try{const obj=JSON.parse(e.target.result);if(Array.isArray(obj.trades)){saveTrades(obj.trades);cb&&cb();}else alert('格式错误');}catch(err){alert('解析失败');}};r.readAsText(file);}
function exportJSON(){const blob=new Blob([JSON.stringify({trades:loadTrades()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='trades_'+Date.now()+'.json';a.click();}
