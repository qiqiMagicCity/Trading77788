
/* Trading777 v2.0 dashboard – implements import / export, dynamic positions, add‑trade */

(function(){

/* ---------- 1. Data bootstrap ---------- */
const defaultPositions = [{symbol:'AAPL',qty:900,avgPrice:100,last:188.95},{symbol:'TSLA',qty:50,avgPrice:200,last:178.45}];
const defaultTrades = [
 {date:'2025-06-30',symbol:'AAPL',side:'SELL',qty:100,price:220,pl:12000,closed:true},
 {date:'2025-06-30',symbol:'AAPL',side:'BUY',qty:100,price:100,pl:0,closed:false},
 {date:'2025-06-29',symbol:'TSLA',side:'SELL',qty:50,price:210,pl:500,closed:true}
];

let positions = JSON.parse(localStorage.getItem('positions')||'null') || defaultPositions.slice();
let trades    = JSON.parse(localStorage.getItem('trades')||'null')    || defaultTrades.slice();

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

function recalcPositions(){
  const map={};
  trades.forEach(t=>{
    if(!map[t.symbol]) map[t.symbol]={symbol:t.symbol,qty:0,cost:0,last:t.price};
    const m=map[t.symbol];
    const signedQty = (t.side==='BUY'||t.side==='COVER') ? t.qty : -t.qty; // BUY/COVER positive, SELL/SHORT negative
    m.qty += signedQty;
    m.cost += t.price * signedQty;
    m.last = t.price;
  });
  positions = Object.values(map).filter(p=>p.qty!==0).map(p=>{
    return {
      symbol:p.symbol,
      qty:p.qty,
      avgPrice: Math.abs(p.qty) ? Math.abs(p.cost)/Math.abs(p.qty) : 0,
      last:p.last
    };
  });
}

  });
}

/* ---------- 4. Statistics ---------- */
function stats(){
  const cost=positions.reduce((s,p)=>s+p.qty*p.avgPrice,0);
  const value=positions.reduce((s,p)=>s+p.qty*p.last,0);
  const floating=value-cost;
  const today=trades.filter(t=>t.date===new Date().toISOString().slice(0,10));
  const todayReal=today.filter(t=>t.closed).reduce((s,t)=>s+t.pl,0);
  const wins=today.filter(t=>t.pl>0).length;
  const losses=today.filter(t=>t.pl<0).length;
  const todayTrades=today.length;
  const histReal=trades.filter(t=>t.closed).reduce((s,t)=>s+t.pl,0);
  return {cost,value,floating,todayReal,wins,losses,todayTrades,totalTrades:trades.length,histReal};
}

/* ---------- 5. Render helpers ---------- */
function updateClocks(){
  const now=new Date();
  const ny=new Date(now.toLocaleString('en-US',{timeZone:'America/New_York'}));
  const vlc=new Date(now.toLocaleString('es-ES',{timeZone:'Europe/Madrid'}));
  const sh=new Date(now.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}));
  const sh=new Date(now.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}));
  const fmt=d=>d.toTimeString().slice(0,8);
  document.getElementById('clocks').innerHTML=
      `纽约：${fmt(ny)} | 瓦伦西亚：${fmt(vlc)} | 上海：${fmt(sh)}`;
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
  const head=['代码','目前持仓','持仓单价','持仓金额','盈亏平衡点','当前浮盈亏','历史交易次数','详情'];
  tbl.innerHTML='<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
  positions.forEach(p=>{
    const amt=p.qty*p.avgPrice;
    const pl=(p.last-p.avgPrice)*p.qty;
    const cls=pl>0?'green':pl<0?'red':'white';
    const times=trades.filter(t=>t.symbol===p.symbol).length;
    tbl.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${p.symbol}</td><td>${p.qty}</td><td>${p.avgPrice.toFixed(2)}</td><td>${amt.toFixed(2)}</td>
        <td>${(p.avgPrice).toFixed(2)}</td><td class="${cls}">${pl.toFixed(2)}</td>
        <td>${times}</td>
        <td><a href="stock.html?symbol=${p.symbol}" class="details">详情</a></td>
      </tr>`);
  });
}

/* Trades table */
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
  const qty=parseInt(prompt('数量?'),10);
  if(!qty||qty<=0){alert('数量无效');return;}
  const price=parseFloat(prompt('单价?'));
  if(!price||price<=0){alert('单价无效');return;}
  const date=new Date().toISOString().slice(0,10);
  // 计算盈亏 (简单计算，假设即时结算)
  let pl=0;
  if(side==='SELL'){
    const pos=positions.find(p=>p.symbol===symbol);
    const avg=pos?pos.avgPrice:price;
    pl=(price-avg)*qty;
  }
  trades.unshift({date,symbol,side,qty,price,pl,closed:side==='SELL'});
  recalcPositions();
  saveData();
  renderStats();renderPositions();renderTrades();
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

/* ---------- 7. Wire up ---------- */
window.addEventListener('load',()=>{
  // recalc positions in case only trades exist
  recalcPositions();
  renderStats();renderPositions();renderTrades();
  updateClocks();
  setInterval(updateClocks,1000);

  document.getElementById('fab')?.addEventListener('click',()=>showTradeModal());
  document.getElementById('export')?.addEventListener('click',exportData);
  document.querySelector('h3.section-title .details')?.addEventListener('click',()=>window.location='trades.html');
  document.getElementById('import')?.addEventListener('click',importData);
});

})();


/* Modern add trade modal */
function showTradeModal(editIndex=null){
  const dlg=document.getElementById('tradeModal');
  const form=document.getElementById('tradeForm');
  const dateInput=document.getElementById('tm-date');
  const symbolInput=document.getElementById('tm-symbol');
  const sideInput=document.getElementById('tm-side');
  const qtyInput=document.getElementById('tm-qty');
  const priceInput=document.getElementById('tm-price');
  if(editIndex!==null){
    const t=trades[editIndex];
    dateInput.value=t.date;
    symbolInput.value=t.symbol;
    sideInput.value=t.side;
    qtyInput.value=t.qty;
    priceInput.value=t.price;
  }else{
    dateInput.value = new Date().toISOString().slice(0,10);
    symbolInput.value='';
    sideInput.value='BUY';
    qtyInput.value='';
    priceInput.value='';
  }
  dlg.showModal();
  form.onsubmit=e=>{
    e.preventDefault();
    const date=dateInput.value;
    const symbol=symbolInput.value.trim().toUpperCase();
    const side=sideInput.value.toUpperCase();
    const qty=parseInt(qtyInput.value,10);
    const price=parseFloat(priceInput.value);
    if(!date||!symbol||!qty||!price){alert('请完整填写');return;}
    const trade={date,symbol,side,qty,price,pl:0,closed:false};
    // 简单 PL 计算
    trade.closed = (side==='SELL'||side==='COVER');
    trades.unshift(trade);
    recalcPositions();
    saveData();
    renderStats();renderPositions();renderTrades();
    dlg.close();
  };
}
