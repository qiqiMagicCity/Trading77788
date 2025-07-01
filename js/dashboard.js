
/* Trading777 v3.0 dashboard – implements import / export, dynamic positions, add‑trade */

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
recalcPositions();


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
  /* 以 FIFO 原则重构持仓与平仓盈亏 */
  const symbolLots = {};   // {SYM: [{qty, price}] }
  const dayStr = new Date().toISOString().slice(0,10);

  trades.sort((a,b)=> new Date(a.date) - new Date(b.date));   // 确保按时间先后

  trades.forEach(t=>{
    const lots = symbolLots[t.symbol] || (symbolLots[t.symbol] = []);
    let remaining = t.qty;
    let realized = 0;

    if(t.side==='BUY' || t.side==='COVER'){      // 买入 / 回补 -> 先覆盖空头
       // 先匹配负值 lot
       for(let i=0; i<lots.length && remaining>0; ){
         const lot = lots[0];
         if(lot.qty < 0){
           const closeQty = Math.min(remaining, -lot.qty);
           realized += (lot.price - t.price) * closeQty;   // 空头盈利 = 建仓价 - 回补价
           lot.qty += closeQty;
           remaining -= closeQty;
           if(lot.qty === 0) lots.shift();
         }else break;
       }
       // 剩余部分开多仓
       if(remaining>0){
         lots.push({qty: remaining, price: t.price});
       }
    }else if(t.side==='SELL' || t.side==='SHORT'){   // 卖出 / 做空
       // 先匹配正值 lot
       for(let i=0; i<lots.length && remaining>0; ){
         const lot = lots[0];
         if(lot.qty > 0){
           const closeQty = Math.min(remaining, lot.qty);
           realized += (t.price - lot.price) * closeQty;   // 多头盈利 = 卖价 - 成本价
           lot.qty -= closeQty;
           remaining -= closeQty;
           if(lot.qty === 0) lots.shift();
         }else break;
       }
       // 剩余部分作为新空头仓位
       if(remaining>0){
         lots.push({qty: -remaining, price: t.price});
       }
    }

    // 写回盈亏与是否已平仓标识
    t.pl = realized;
    t.closed = realized !== 0;
  });

  /* 汇总成持仓数组 */
  positions = Object.entries(symbolLots).map(([sym, lots])=>{
      const qty = lots.reduce((s,l)=> s + l.qty, 0);
      const cost = lots.reduce((s,l)=> s + l.qty * l.price, 0);
      return {symbol: sym,
              qty: qty,
              avgPrice: qty ? Math.abs(cost) / Math.abs(qty) : 0,
              last: lots.length ? lots[lots.length-1].price : 0,
              priceOk: false};
  }).filter(p=> p.qty !== 0);
}


/* ---------- 4. Statistics ---------- */

function stats(){
  // 重新计算账户统计数据，兼容多空仓位显示
  const cost = positions.reduce((sum, p)=> sum + Math.abs(p.qty * p.avgPrice), 0);
  const value = positions.reduce((sum,p)=> p.priceOk!==false ? sum + Math.abs(p.qty)*p.last : sum, 0);
  // 对于空头仓位，浮动盈亏 = 建仓均价 - 现价
  
const floating = positions.reduce((sum,p)=>{
  if(p.qty===0||p.priceOk===false) return sum;
  const pl = p.qty>0 ? (p.last - p.avgPrice)*p.qty : (p.avgPrice - p.last)*Math.abs(p.qty);
  return sum + pl;
},0);


  const todayStr = new Date().toISOString().slice(0,10);
  const todayTrades = trades.filter(t=> t.date === todayStr);
  const todayReal = todayTrades.reduce((s,t)=> s + (t.pl||0), 0);
  const wins = todayTrades.filter(t=> (t.pl||0) > 0).length;
  const losses = todayTrades.filter(t=> (t.pl||0) < 0).length;
  const histReal = trades.reduce((s,t)=> s + (t.pl||0), 0);

  return {
    cost,
    value,
    floating,
    todayReal,
    wins,
    losses,
    todayTrades: todayTrades.length,
    totalTrades: trades.length,
    histReal
  };
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
  const head=['代码','中文','实时价格','目前持仓','持仓单价','持仓金额','盈亏平衡点','当前浮盈亏','标的盈亏','历史交易次数','详情'];
  tbl.innerHTML='<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
  positions.forEach(p=>{
    const amt=Math.abs(p.qty*p.avgPrice);
    const pl=(p.last-p.avgPrice)*p.qty;
    const cls=pl>0?'green':pl<0?'red':'white';
    const times=trades.filter(t=>t.symbol===p.symbol).length;
    
const realized=trades.filter(t=>t.symbol===p.symbol&&t.closed).reduce((s,t)=>s+t.pl,0);
const totalPNL=pl+realized;
tbl.insertAdjacentHTML('beforeend',`
  <tr>
    <td>${p.symbol}</td>
    <td>${window.SymbolCN[p.symbol]||''}</td>
    <td id="rt-${p.symbol}">${(p.priceOk===false?'稍后获取':p.last.toFixed(2))}</td>
    <td>${p.qty}</td>
    <td>${p.avgPrice.toFixed(2)}</td>
    <td>${amt.toFixed(2)}</td>
    <td>${(p.avgPrice).toFixed(2)}</td>
    <td class="${cls}">${(p.priceOk===false?'--':pl.toFixed(2))}</td>
    <td class="${totalPNL>0?'green':totalPNL<0?'red':'white'}">${(p.priceOk===false?'--':totalPNL.toFixed(2))}</td>
    <td>${times}</td>
    <td><a href="stock.html?symbol=${p.symbol}" class="details">详情</a></td>
  </tr>`);
  });
}

/* Trades table */
function renderTrades(){
  const tbl = document.getElementById('trades');
  if(!tbl) return;
  const head = ['日期','星期','代码','方向','单价','数量','订单金额','详情'];
  const sortedTrades = trades.slice().sort((a,b)=> new Date(b.date) - new Date(a.date)); // 倒序排序
  tbl.innerHTML = '<tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr>';
  sortedTrades.slice(0,100).forEach(t=>{
    const amt = (t.qty * t.price).toFixed(2);
    const sideCls = t.side==='BUY' ? 'green' : t.side==='SELL' ? 'red' : t.side==='SHORT' ? 'purple' : 'blue';
    const wkAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][ new Date(t.date).getDay() ];
    tbl.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${t.date}</td>
        <td>${wkAbbr}</td>
        <td>${t.symbol}</td>
        <td class="${sideCls}">${t.side}</td>
        <td>${t.price.toFixed(2)}</td>
        <td class="${sideCls}">${t.qty}</td>
        <td>${amt}</td>
        <td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>
      </tr>`);
  });
}</th>`).join('')+'</tr>';
  trades.slice(0,100).forEach(t=>{
    const amt=(t.qty*t.price).toFixed(2);
    const sideCls = t.side==='BUY' ? 'green' : t.side==='SELL' ? 'red' : t.side==='SHORT' ? 'purple' : 'blue';
    const wkAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][ new Date(t.date).getDay() ];
    tbl.insertAdjacentHTML('beforeend',`
      <tr>
        <td>${t.date}</td>
        <td>${wkAbbr}</td>
        <td>${t.symbol}</td>
        <td class="${sideCls}">${t.side}</td>
        <td>${t.price.toFixed(2)}</td>
        <td class="${sideCls}">${t.qty}</td>
        <td>${amt}</td>
        <td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>
      </tr>`);
  });
}


/* ---------- 5. Symbols List (功能区3) ---------- */
function renderSymbolsList(){
  const area = document.getElementById('symbols-list');
  if(!area) return;
  area.innerHTML='';
  const syms = [...new Set(trades.map(t=>t.symbol))].sort();
  syms.forEach(sym=>{
    const a=document.createElement('a');
    a.href='stock.html?symbol='+encodeURIComponent(sym);
    a.className='symbol-tag';
    a.textContent=sym;
    area.appendChild(a);
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
        renderStats();renderPositions();renderPositions();renderTrades();
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
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
          <option value="SHORT">SHORT</option>
          <option value="COVER">COVER</option>
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
    const dateInput = document.getElementById('t-date').value;
    const date = dateInput ? dateInput.slice(0,10) : new Date().toISOString().slice(0,10);
    const symbol  = document.getElementById('t-symbol').value.trim().toUpperCase();
    const side    = document.getElementById('t-side').value;
    const qty     = Math.abs(parseInt(document.getElementById('t-qty').value,10));
    const price   = parseFloat(document.getElementById('t-price').value);
    if(!symbol || !qty || !price){ alert('请完整填写表单'); return; }

    let pl = 0;
    let closedFlag = false;
    // 计算盈亏并确定是否平仓
    if(side === 'SELL'){        // 卖出现有多头
        const pos = positions.find(p=>p.symbol===symbol && p.qty>0);
        const avg = pos ? pos.avgPrice : price;
        pl = (price - avg) * qty;
        closedFlag = true;
    }else if(side === 'COVER'){   // 回补空头
        const pos = positions.find(p=>p.symbol===symbol && p.qty<0);
        const avg = pos ? Math.abs(pos.avgPrice) : price;
        pl = (avg - price) * qty;
        closedFlag = true;
    }

    const trade = {date,symbol,side,qty,price,pl,closed:closedFlag};

    if(editIndex != null){
        trades[editIndex] = trade;
    }else{
        trades.unshift(trade);
    }

    recalcPositions();
    saveData();
    renderStats();
    renderPositions();
    renderTrades();
    close();
};

  
}


/* ---------- 7. Wire up ---------- */
window.addEventListener('load',()=>{
  // recalc positions in case only trades exist
  recalcPositions();
  renderStats();renderPositions();renderPositions();renderTrades();
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



/* ---------- 6. Real‑time price via Finnhub ---------- */

function updatePrices(){
  // 尝试读取 KEY.txt 里的 Finnhub key；如果读取失败就回退到内置 key
  fetch('KEY.txt')
    .then(r=> r.ok ? r.text() : '')
    .catch(()=> '')        // in case of 404/网络错误
    .then(text=>{
       const m   = text.match(/Finnhub key：([\w]+)/);
       const apiKey = (m?m[1]:'d19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg').trim();
       if(!apiKey) return;

       // 为当前所有持仓并行请求价格，全部返回后再统一刷新界面
       const reqs = positions.map(p=>{
         return fetch(`https://finnhub.io/api/v1/quote?symbol=${p.symbol}&token=${apiKey}`)
                .then(r=>r.json())
                .then(q=>{
                   if(q && q.c){ p.last = q.c; p.priceOk = true; } else { p.priceOk = false; }
                })
                .catch(()=>{/* 网络错误忽略 */});
       });

       Promise.all(reqs).then(()=>{
          renderPositions();
          renderStats();
       });
    });
}

/* fetch prices on load */
updatePrices();
  // 每分钟刷新一次价格
  setInterval(updatePrices, 60000);
  renderSymbolsList();
})();
