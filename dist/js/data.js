
const STORAGE='trading_data_v03';
function loadTrades(){try{return JSON.parse(localStorage.getItem(STORAGE))||[]}catch(e){return [];}}
function saveTrades(t){localStorage.setItem(STORAGE,JSON.stringify(t));}
function addTrade(tr){const arr=loadTrades();arr.push(tr);saveTrades(arr);}
function deleteTrade(idx){const arr=loadTrades();arr.splice(idx,1);saveTrades(arr);}
function importJSON(file,cb){const r=new FileReader();r.onload=e=>{try{const o=JSON.parse(e.target.result);if(Array.isArray(o.trades)){saveTrades(o.trades);cb&&cb();}else alert('格式错误');}catch(err){alert('解析失败');}};r.readAsText(file);}
function exportJSON(){const blob=new Blob([JSON.stringify({trades:loadTrades()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='trades_'+Date.now()+'.json';a.click();}
