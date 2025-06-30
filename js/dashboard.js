/* DEMO static data */
const positions=[{symbol:'AAPL',qty:900,avgPrice:100,last:188.95},{symbol:'TSLA',qty:50,avgPrice:200,last:178.45}];
const trades=[
 {date:'2025-06-30',symbol:'AAPL',side:'SELL',qty:100,price:220,pl:12000,closed:true},
 {date:'2025-06-30',symbol:'AAPL',side:'BUY',qty:100,price:100,pl:0,closed:false},
 {date:'2025-06-29',symbol:'TSLA',side:'SELL',qty:50,price:210,pl:500,closed:true}
];
localStorage.setItem('trades',JSON.stringify(trades)); // share to stock.html

function updateClocks(){
  const now=new Date();
  const ny   = new Date(now.toLocaleString('en-US',{timeZone:'America/New_York'}));
  const lon  = new Date(now.toLocaleString('en-GB',{timeZone:'Europe/London'}));
  const sh   = new Date(now.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}));
  const fmt=d=>d.toTimeString().slice(0,8);
  document.getElementById('clocks').innerHTML=
    `<span>纽约 ${fmt(ny)}</span><span>伦敦 ${fmt(lon)}</span><span>上海 ${fmt(sh)}</span>`;
}
setInterval(updateClocks,1000); updateClocks();

function todayISO(){return new Date().toISOString().slice(0,10);}
function stats(){
  const cost=positions.reduce((s,p)=>s+p.qty*p.avgPrice,0);
  const value=positions.reduce((s,p)=>s+p.qty*p.last,0);
  const floating=value-cost;
  const today=todayISO();
  let todayReal=0,wins=0,losses=0;
  trades.filter(t=>t.closed&&t.date===today).forEach(t=>{todayReal+=t.pl;t.pl>=0?wins++:losses++;});
  const todayTrades=trades.filter(t=>t.date===today).length;
  const histReal=trades.filter(t=>t.closed).reduce((s,t)=>s+t.pl,0);
  return {cost,value,floating,todayReal,wins,losses,todayTrades,totalTrades:trades.length,histReal};
}

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
    box.innerHTML=`<div class="box-title">${it[0]}</div><div class="box-value">${it[1]}</div>`;
  });
}

function renderPositions(){
  const tbl=document.getElementById('positions');
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
        <td>${(p.avgPrice+pl/p.qty).toFixed(2)}</td><td class="${cls}">${pl.toFixed(2)}</td>
        <td>${times}</td>
        <td><a href="stock.html?symbol=${p.symbol}" class="details">详情</a></td>
      </tr>`);
  });
}

function renderTrades(){
  const tbl=document.getElementById('trades');
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

window.addEventListener('load',()=>{
  renderStats();renderPositions();renderTrades();
});
