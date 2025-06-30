
/* Trading777 v3.0 dashboard – implements import / export, dynamic positions, add‑trade */

(function(){
const VERSION='3.1';
document.title=`Trading777 v${VERSION}`;

/* ---------- 1. Data bootstrap ---------- */
const defaultPositions = [{symbol:'AAPL',qty:900,avgPrice:100,last:188.95},{symbol:'TSLA',qty:50,avgPrice:200,last:178.45}];
const defaultTrades = [
 {date:'2025-06-30',symbol:'AAPL',side:'SELL',qty:100,price:220,pl:12000,closed:true},
 {date:'2025-06-30',symbol:'AAPL',side:'BUY',qty:100,price:100,pl:0,closed:false},
 {date:'2025-06-29',symbol:'TSLA',side:'SELL',qty:50,price:210,pl:500,closed:true}
];

let positions = JSON.parse(localStorage.getItem('positions')||'null') || defaultPositions.slice();
let trades    = JSON.parse(localStorage.getItem('trades')||'null')    || defaultTrades.slice();
recalcPositions();
renderStats();
renderPositions();
renderTrades();
updatePrices();



/* Save helper */
function saveData(){
  localStorage.setItem('positions',JSON.stringify(positions));
  localStorage.setItem('trades',JSON.stringify(trades));
}

/* ---------- 2. Utils ---------- */
function fmtSign(n){
  const cls=n>0?'green':n<0?'red':'white';
  const val=Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return `<span class="${cls}">${n<0?'-':''}${val}</span>`;
}
function fmtDollar(n){return `$ ${fmtSign(n)}`;}
function fmtInt(n){return `<span class="white">${Number(n).toLocaleString()}</span>`;}
function fmtWL(w,l){return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`;}
const Utils={fmtDollar,fmtInt,fmtWL};

/* ---------- 3. Derived data ---------- */

/* Re‑calc positions by applying trades on top of existing positions */
function recalcPositions(){
  /* Build positions purely from trades list – no carry‑over. */
  const map = {};
  trades.forEach(t=>{
    const m = map[t.symbol] || (map[t.symbol] = {symbol:t.symbol, qty:0, cost:0, last:t.price});
    const qty = t.qty;
    const price = t.price;
    if(t.side==='BUY' || t.side==='回补'){
      /* Buy or cover short – add to position */
      m.cost += price * qty;
      m.qty  += qty;
    }else if(t.side==='SELL' || t.side==='做空'){
      /* Sell or short – reduce position (could go negative if short, but we treat as reducing) */
      const avg = m.qty ? m.cost / m.qty : price;
      m.qty  -= qty;
      m.cost -= avg * qty;
    }
    m.last = price;
  });
  positions = Object.values(map)
     .filter(p=>p.qty!==0)                        /* keep only open long positions */
     .map(p=>{
        return {
          symbol: p.symbol,
          qty: p.qty,
          avgPrice: p.qty ? Math.abs(p.cost) / Math.abs(p.qty) : 0,
          last: p.last
        };
     });
}

/* ---------- 4. Statistics ---------- */

function stats(){
  const cost = positions.reduce((s,p)=> s + Math.abs(p.qty) * p.avgPrice, 0);
  const floating = positions.reduce((s,p)=> s + (p.last - p.avgPrice) * p.qty, 0);
  const value = positions.reduce((s,p)=> s + p.qty * p.last, 0);
  const todayStr = new Date().toISOString().slice(0,10);
  const todayTradesArr = trades.filter(t=> t.date === todayStr);
  const todayReal = todayTradesArr.filter(t=> t.closed).reduce((s,t)=> s + t.pl, 0);
  const wins = todayTradesArr.filter(t=> t.pl > 0).length;
  const losses = todayTradesArr.filter(t=> t.pl < 0).length;
  const todayTrades = todayTradesArr.length;
  const histReal = trades.filter(t=> t.closed).reduce((s,t)=> s + t.pl, 0);
  return {cost,value,floating,todayReal,wins,losses,todayTrades,totalTrades:trades.length,histReal};
}


/* ---------- 5. Render helpers ---------- */


function updateClocks(){
  const fmt = tz => new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour12:false});
  document.getElementById('clocks').innerHTML =
      `纽约：${fmt('America/New_York')} | 瓦伦西亚：${fmt('Europe/Madrid')} | 上海：${fmt('Asia/Shanghai')}`;
}


/* Stats boxes */
function renderStats(){
  const s=stats();
  const a=[
    ['账户总成本',Utils.fmtDollar(s.cost)],
    ['现有市值',Utils.fmtDollar(s.value)],
    ['当前浮动盈亏',Utils.fmtDollar(s.floating)],
    ['当日已实现盈亏',Utils.fmtDollar(s.todayReal)],
    ['当日盈亏笔数',Utils.fmtWL(s.wins,s.losses)],
    ['当日交易次数',Utils.fmtInt(s.todayTrades)],
    ['累计交易次数',Utils.fmtInt(s.totalTrades)],
    ['历史已实现盈亏',Utils.fmtDollar(s.histReal)]
  ];
  a.forEach((it,i)=>{
    const box=document.getElementById('stat-'+(i+1));
    if(!box) return;
    box.innerHTML=`<div class="box-title">${it[0]}</div><div class="box-value">${it[1]}</div>`;
  });
}

/* Positions table */

function renderPositions(){
  const tbl=document.getElementById('positions');
  if(!tbl) return;
  const head=['代码','实时价格','目前持仓','持仓单价','持仓金额','盈亏平衡点','当前浮盈亏','标的盈亏','历史交易次数','详情'];
  tbl.innerHTML='<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
  positions.forEach(p=>{
    const amt = Math.abs(p.qty) * p.avgPrice;
    const breakeven = p.avgPrice;
    const floating = (p.last - breakeven) * p.qty; // long positive, short negative
    const underlying = floating; // 同交易模型，标的盈亏=浮盈亏
    const cls = underlying>0?'green':underlying<0?'red':'white';
    const times = trades.filter(t=>t.symbol===p.symbol).length;
    tbl.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${p.symbol}</td>
        <td>${p.last.toFixed(2)}</td>
        <td>${p.qty}</td>
        <td>${p.avgPrice.toFixed(2)}</td>
        <td>${amt.toFixed(2)}</td>
        <td>${breakeven.toFixed(2)}</td>
        <td class="${cls}">${floating.toFixed(2)}</td>
        <td class="${cls}">${underlying.toFixed(2)}</td>
        <td>${times}</td>
        <td><a href="stock.html?symbol=${p.symbol}" class="details">详情</a></td>
      </tr>`);
  });
}


function renderTrades(){
  const tbl=document.getElementById('trades');
  if(!tbl) return;
  const head=['日期','代码','方向','单价','数量','订单金额','详情'];
  tbl.innerHTML='<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
  trades.slice(0,100).forEach(t=>{
    const amt=(t.qty*t.price).toFixed(2);
    tbl.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${t.date}</td><td>${t.symbol}</td><td>${t.side}</td>
        <td>${t.price.toFixed(2)}</td><td>${t.qty}</td>
        <td>${amt}</td>
        <td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>
      </tr>`);
  });
}

/* ---------- 6. Actions ---------- */

function addTrade(){
  openTradeForm();
}

/* Export */
function exportData(){
  const data={positions,trades,generated:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='trading777_backup_'+Date.now()+'.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* Import */
function importData(){
  const input=document.createElement('input');
  input.type='file';
  input.accept='.json,application/json';
  input.onchange=e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(data.trades){ trades=data.trades; }
        if(data.positions){ positions=data.positions; } else { recalcPositions(); }
        saveData();
        renderStats();renderPositions();renderTrades();
        alert('导入成功!');
      }catch(err){
        alert('导入失败: '+err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}


/* ---------- 7b. Trade modal ---------- */
function openTradeForm(editIndex){
  let modal=document.getElementById('trade-modal');
  if(modal){ modal.remove(); }
  modal=document.createElement('div');
  modal.id='trade-modal';
  modal.className='modal';
  modal.innerHTML=`
    <div class="modal-content">
      <h3>${editIndex==null?'添加交易':'编辑交易'}</h3>
      <label>交易时间</label><input type="datetime-local" id="t-date" />
      <label>股票代码</label><input type="text" id="t-symbol" />
      <label>交易方向</label>
        <select id="t-side">
          <option value="BUY">买</option>
          <option value="SELL">卖</option>
          <option value="做空">做空</option>
          <option value="回补">回补</option>
        </select>
      <label>数量</label><input type="number" id="t-qty" />
      <label>单价</label><input type="number" step="0.01" id="t-price" />
      <div style="margin-top:14px;text-align:right;">
        <button id="t-cancel">取消</button>
        <button id="t-save">确定</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  if(editIndex!=null){
     const t=trades[editIndex];
     document.getElementById('t-date').value=t.date+'T00:00:00';
     document.getElementById('t-symbol').value=t.symbol;
     document.getElementById('t-side').value=t.side;
     document.getElementById('t-qty').value=t.qty;
     document.getElementById('t-price').value=t.price;
  }else{
     document.getElementById('t-date').value=new Date().toISOString().slice(0,16);
  }
  function close(){modal.remove();}
  document.getElementById('t-cancel').onclick=close;
  document.getElementById('t-save').onclick=function(){
     const date=document.getElementById('t-date').value.slice(0,10);
     const symbol=document.getElementById('t-symbol').value.trim().toUpperCase();
     const side=document.getElementById('t-side').value;
     const qty=parseInt(document.getElementById('t-qty').value,10);
     const price=parseFloat(document.getElementById('t-price').value);
     if(!symbol||!qty||!price){alert('请完整填写表单');return;}
     let pl=0;
     if(side==='SELL'){
       const pos=positions.find(p=>p.symbol===symbol);
       const avg=pos?pos.avgPrice:price;
       pl=(price-avg)*qty;
     }
     const trade={date,symbol,side,qty,price,pl,closed:side==='SELL'};
     if(editIndex!=null){
        trades[editIndex]=trade;
     }else{
        trades.unshift(trade);
     }
     recalcPositions();
     saveData();
     renderStats();renderPositions();renderTrades();
     close();
  };
  
}


/* ---------- 7. Wire up ---------- */
window.addEventListener('load',()=>{
  // recalc positions in case only trades exist
  recalcPositions();
  renderStats();renderPositions();renderTrades();
  updateClocks();
  setInterval(updateClocks,1000);

  document.getElementById('fab')?.addEventListener('click',addTrade);
  document.getElementById('export')?.addEventListener('click',exportData);
  if(location.hash==='#edit'){
    const idx=parseInt(localStorage.getItem('editIndex'),10);
    if(!isNaN(idx)){
      openTradeForm(idx);
      localStorage.removeItem('editIndex');
      history.replaceState(null,'',location.pathname);
    }
  }
  document.getElementById('import')?.addEventListener('click',importData);
});


/* ---------- Price updater (Finnhub) ---------- */
const FINNHUB_TOKEN = window.FINNHUB_TOKEN || ''; // in js/config.js or set globally
async function updatePrices(){
  if(!FINNHUB_TOKEN){ console.warn('Finnhub token missing. Skipping price update.'); renderStats(); renderPositions(); return; }
  const uniqueSymbols = [...new Set(positions.map(p=>p.symbol))];
  await Promise.all(uniqueSymbols.map(async sym=>{
    try{
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_TOKEN}`);
      const jsn = await res.json();
      if(jsn && jsn.c){
         positions.filter(p=>p.symbol===sym).forEach(p=> p.last = jsn.c);
      }
    }catch(e){ console.error('Price fetch error',sym,e); }
  }));
  renderStats();
  renderPositions();
}

})();