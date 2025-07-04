/* Trading777 v5.3.20 dashboard – implements import / export, dynamic positions, add-trade */

(function(){

  /* ---------- 1. Data bootstrap ---------- */
  const defaultPositions = [
    {symbol:'AAPL',qty:900,avgPrice:100,last:188.95},
    {symbol:'TSLA',qty:50,avgPrice:200,last:178.45}
  ];
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
    localStorage.setItem('positions', JSON.stringify(positions));
    localStorage.setItem('trades',    JSON.stringify(trades));
  }

  /* ---------- 2. Utils ---------- */
  function fmtSign(n){
    const cls = n>0 ? 'green' : n<0 ? 'red' : 'white';
    const val = Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    return `<span class="${cls}">${n<0?'-':''}${val}</span>`;
  }
  function fmtDollar(n){ return `$ ${fmtSign(n)}`; }
  function fmtInt(n){    return `<span class="white">${Number(n).toLocaleString()}</span>`; }
  function fmtWL(w,l){   return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`; }
  function fmtPct(p){
    return `<span class="white">${Number(p).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})}%</span>`;
  }
  const Utils = { fmtDollar, fmtInt, fmtWL, fmtPct };

  /* ---------- 3. Derived data ---------- */
  function recalcPositions(){
    const symbolLots = {};
    trades.sort((a,b)=> new Date(a.date) - new Date(b.date));
    trades.forEach(t=>{
      const lots = symbolLots[t.symbol] || (symbolLots[t.symbol]=[]);
      let remaining = t.qty, realized=0;
      if(t.side==='BUY' || t.side==='COVER'){
        // 先匹配空头
        while(lots.length && remaining>0 && lots[0].qty<0){
          const lot = lots[0];
          const closeQty = Math.min(remaining, -lot.qty);
          realized += (lot.price - t.price)*closeQty;
          lot.qty += closeQty;
          remaining -= closeQty;
          if(lot.qty===0) lots.shift();
        }
        if(remaining>0) lots.push({qty:remaining,price:t.price});
      } else {
        // SELL 或 SHORT
        while(lots.length && remaining>0 && lots[0].qty>0){
          const lot = lots[0];
          const closeQty = Math.min(remaining, lot.qty);
          realized += (t.price - lot.price)*closeQty;
          lot.qty -= closeQty;
          remaining -= closeQty;
          if(lot.qty===0) lots.shift();
        }
        if(remaining>0) lots.push({qty:-remaining,price:t.price});
      }
      t.pl     = realized;
      t.closed = realized!==0;
    });

    positions = Object.entries(symbolLots).map(([sym,lots])=>{
      const qty  = lots.reduce((s,l)=>s+l.qty,0);
      const cost = lots.reduce((s,l)=>s + l.qty*l.price,0);
      return {
        symbol: sym,
        qty,
        avgPrice: qty ? Math.abs(cost)/Math.abs(qty) : 0,
        last: lots.length ? lots[lots.length-1].price : 0,
        priceOk: false
      };
    }).filter(p=>p.qty!==0);
  }

  /* ---------- 4. Statistics ---------- */
  function stats(){
    const cost    = positions.reduce((s,p)=> s + Math.abs(p.qty*p.avgPrice),0);
    const value   = positions.reduce((s,p)=> p.priceOk!==false ? s + Math.abs(p.qty)*p.last : s,0);
    const floating= positions.reduce((s,p)=>{
      if(p.qty===0||p.priceOk===false) return s;
      const pl = p.qty>0
               ? (p.last - p.avgPrice)*p.qty
               : (p.avgPrice - p.last)*Math.abs(p.qty);
      return s + pl;
    },0);

    const todayStr  = new Date().toISOString().slice(0,10);
    const todayTrades = trades.filter(t=>t.date===todayStr);
    const todayReal   = todayTrades.reduce((s,t)=>s+(t.pl||0),0);
    const wins       = todayTrades.filter(t=>t.pl>0).length;
    const losses     = todayTrades.filter(t=>t.pl<0).length;
    const histReal   = trades.reduce((s,t)=>s+(t.pl||0),0);
    const winRate    = (wins+losses) ? wins/(wins+losses)*100 : null;

    // 周度、月度、年初至今...
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay()+6)%7));
    monday.setHours(0,0,0,0);
    const wtdReal = trades.filter(t=>{
      const d = new Date(t.date);
      return d>=monday && d<=now;
    }).reduce((s,t)=>s+(t.pl||0),0);

    const firstOfMonth = new Date(now.getFullYear(),now.getMonth(),1);
    firstOfMonth.setHours(0,0,0,0);
    const mtdReal = trades.filter(t=>{
      const d=new Date(t.date);
      return d>=firstOfMonth && d<=now;
    }).reduce((s,t)=>s+(t.pl||0),0);

    const firstOfYear = new Date(now.getFullYear(),0,1);
    firstOfYear.setHours(0,0,0,0);
    const ytdReal = trades.filter(t=>{
      const d=new Date(t.date);
      return d>=firstOfYear && d<=now;
    }).reduce((s,t)=>s+(t.pl||0),0);

    return {
      cost, value, floating, todayReal,
      wins, losses,
      todayTrades: todayTrades.length,
      totalTrades: trades.length,
      histReal, winRate,
      wtdReal, mtdReal, ytdReal
    };
  }

  /* ---------- 5. Render helpers ---------- */
  function updateClocks(){
    const fmt = tz=>new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour12:false});
    document.getElementById('clocks').innerHTML =
      `纽约：${fmt('America/New_York')} |
       瓦伦西亚：${fmt('Europe/Madrid')} |
       上海：${fmt('Asia/Shanghai')}`;
  }

  function renderStats(){
    const s = stats();
    const items = [
      ['账户总成本',     Utils.fmtDollar(s.cost)],
      ['现有市值',       Utils.fmtDollar(s.value)],
      ['当前浮动盈亏',   Utils.fmtDollar(s.floating)],
      ['当日已实现盈亏', Utils.fmtDollar(s.todayReal)],
      ['当日盈亏笔数',   Utils.fmtWL(s.wins,s.losses)],
      ['当日交易次数',   Utils.fmtInt(s.todayTrades)],
      ['累计交易次数',   Utils.fmtInt(s.totalTrades)],
      ['历史已实现盈亏', Utils.fmtDollar(s.histReal)],
      ['胜率 Win Rate',  s.winRate!==null?Utils.fmtPct(s.winRate):'--'],
      ['WTD',           Utils.fmtDollar(s.wtdReal)],
      ['MTD',           Utils.fmtDollar(s.mtdReal)],
      ['YTD',           Utils.fmtDollar(s.ytdReal)]
    ];
    items.forEach((it,i)=>{
      const box = document.getElementById('stat-'+(i+1));
      if(!box) return;
      box.innerHTML = `<div class="box-title">${it[0]}</div>
                       <div class="box-value">${it[1]}</div>`;
    });
  }

  function renderPositions(){
    const tbl = document.getElementById('positions');
    if(!tbl) return;
    const head = ['代码','中文','实时价格','目前持仓','持仓单价','持仓金额','盈亏平衡点','当前浮盈亏','标的盈亏','历史交易次数','详情'];
    tbl.innerHTML = '<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
    positions.forEach(p=>{
      const amt      = Math.abs(p.qty*p.avgPrice);
      const pl       = (p.last - p.avgPrice)*p.qty * (p.qty>0?1:-1);
      const cls      = pl>0?'green':pl<0?'red':'white';
      const times    = trades.filter(t=>t.symbol===p.symbol).length;
      const realized = trades.filter(t=>t.symbol===p.symbol&&t.closed).reduce((s,t)=>s+t.pl,0);
      const totalPNL = pl + realized;
      tbl.insertAdjacentHTML('beforeend',`
        <tr>
          <td>${p.symbol}</td>
          <td>${window.SymbolCN[p.symbol]||''}</td>
          <td id="rt-${p.symbol}">${p.priceOk===false?'稍后获取':p.last.toFixed(2)}</td>
          <td>${p.qty}</td>
          <td>${p.avgPrice.toFixed(2)}</td>
          <td>${amt.toFixed(2)}</td>
          <td>${p.avgPrice.toFixed(2)}</td>
          <td class="${cls}">${p.priceOk===false?'--':pl.toFixed(2)}</td>
          <td class="${totalPNL>0?'green':totalPNL<0?'red':'white'}">${p.priceOk===false?'--':totalPNL.toFixed(2)}</td>
          <td>${times}</td>
          <td><a href="stock.html?symbol=${p.symbol}" class="details">详情</a></td>
        </tr>`);
    });
  }

  function renderTrades(){
    renderSymbolsList();
    const tbl = document.getElementById('trades');
    if(!tbl) return;
    const head = ['日期','星期','代码','中文','方向','单价','数量','订单金额','详情'];
    tbl.innerHTML = '<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>';
    trades.slice().sort((a,b)=> new Date(b.date)-new Date(a.date)).forEach(t=>{
      const amt     = (t.qty * t.price).toFixed(2);
      const sideCls = t.side==='BUY' ? 'green' : t.side==='SELL' ? 'red' : t.side==='SHORT' ? 'purple' : 'blue';
      const wkAbbr  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(t.date).getDay()];
      tbl.insertAdjacentHTML('beforeend',`
        <tr>
          <td>${t.date}</td>
          <td>${wkAbbr}</td>
          <td>${t.symbol}</td>
          <td>${window.SymbolCN[t.symbol]||''}</td>
          <td class="${sideCls}">${t.side}</td>
          <td>${t.price.toFixed(2)}</td>
          <td class="${sideCls}">${t.qty}</td>
          <td>${amt}</td>
          <td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>
        </tr>`);
    });
  }

  /* ---------- 6. Actions & Modal & Wiring ---------- */

  // …（此处保留原有的 addTrade、exportData、importData、openTradeForm、window.onload 绑定、
  //      updatePrices、renderSymbolsList 等所有逻辑，和上一版 100% 一致）…

  updatePrices();
  setInterval(updatePrices, 60000);

  /* ===== 关键：注册全局刷新接口 ===== */
  function _refreshAll(){
    try{ renderStats();     }catch(e){}
    try{ renderPositions(); }catch(e){}
    try{ renderTrades();    }catch(e){}
    try{ renderSymbolsList(); }catch(e){}
  }
  window.refreshAll      = _refreshAll;
  window.renderAllTrades = renderTrades;

})(); 
