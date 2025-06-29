import { fmtDollar, fmtWL, fmtInt } from './calc.js';

// Mock data section ---------------------------------
// In production these should be fetched from Supabase & Finnhub
const holdings = [
    { symbol:'AAPL', qty:900, avgCost:100 },
];
let latestPriceCache = { 'AAPL': 201 }; // stub

const todayTrades = [
    { symbol:'AAPL', side:'buy', price:100, qty:100, amount:10000, ts:'2025-06-29', pnl:0 },
    { symbol:'AAPL', side:'sell', price:220, qty:100, amount:22000, ts:'2025-06-29', pnl:12000 },
];

const historyTrades = [...todayTrades]; // stub

// Core calculations ---------------------------------
function calcStats(){
    // 1 账户总成本 = Σ(持仓数量 × 持仓均价)
    const totalCost = holdings.reduce((s,h)=>s+h.qty*h.avgCost,0);
    // 2 现有市值 = Σ(持仓数量 × 最新市价)
    const totalMarket = holdings.reduce((s,h)=>s+h.qty*latestPriceCache[h.symbol],0);
    // 3 当前浮动盈亏
    const floating = totalMarket - totalCost;
    // 4 当日已实现盈亏 (todayTrades sum pnl)
    const realizedToday = todayTrades.reduce((s,t)=>s+t.pnl,0);
    // 5 当日盈亏笔数 (win/lose count)
    let w=0,l=0;
    todayTrades.forEach(t=>{
        if(t.pnl>0) w++; else if(t.pnl<0) l++;
    });
    // 6 当日交易次数 (single-leg count today)
    const tradesTodayCount = todayTrades.length;
    // 7 累计交易次数
    const tradesTotalCount = historyTrades.length;
    // 8 历史已实现盈亏
    const realizedAll = historyTrades.reduce((s,t)=>s+t.pnl,0);

    return { totalCost,totalMarket,floating,realizedToday,wl:{w,l},tradesTodayCount,tradesTotalCount,realizedAll };
}

function renderStats(){
    const s = calcStats();
    const map = [
        {id:1,label:'账户总成本',val:fmtDollar(s.totalCost)},
        {id:2,label:'现有市值',val:fmtDollar(s.totalMarket)},
        {id:3,label:'当前浮动盈亏',val:fmtDollar(s.floating)},
        {id:4,label:'当日已实现盈亏',val:fmtDollar(s.realizedToday)},
        {id:5,label:'当日盈亏笔数',val:fmtWL(s.wl.w,s.wl.l)},
        {id:6,label:'当日交易次数',val:fmtInt(s.tradesTodayCount)},
        {id:7,label:'累计交易次数',val:fmtInt(s.tradesTotalCount)},
        {id:8,label:'历史已实现盈亏',val:fmtDollar(s.realizedAll)},
    ];
    const grid = document.querySelector('.stat-grid');
    grid.innerHTML = map.map(item=>`
        <div class="stat-card" id="stat-${item.id}">
            <div class="stat-title">${item.label}</div>
            <div class="stat-value">${item.val}</div>
        </div>`).join('');
}

// Time bar update -----------------------------------
function updateClocks(){
    const now = new Date();
    const ny = now.toLocaleTimeString('en-US',{timeZone:'America/New_York',hour12:false});
    const lon = now.toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour12:false});
    const sh = now.toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour12:false});
    document.getElementById('clock-ny').textContent = '纽约 '+ny;
    document.getElementById('clock-lon').textContent = ' 伦敦 '+lon;
    document.getElementById('clock-sh').textContent = ' 上海 '+sh;
}

// Init
document.addEventListener('DOMContentLoaded',()=>{
    renderStats();
    updateClocks();
    setInterval(updateClocks,1000);
});
