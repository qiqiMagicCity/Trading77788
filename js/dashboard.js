import { fmtDollar, fmtInt, fmtWL } from './calc.js';

// （示例）静态数据或从本地 storage 读取
let trades = JSON.parse(localStorage.getItem('trades') || '[]');
let positions = [ /* 你的持仓数据 */ ];

// 渲染世界时钟
function updateClocks(){
  const now = new Date();
  const zones = [
    ['纽约','America/New_York'],
    ['伦敦','Europe/London'],
    ['上海','Asia/Shanghai']
  ];
  const out = zones.map(([label, tz])=>{
    const time = new Date(now.toLocaleString('en-US',{timeZone:tz})).toTimeString().slice(0,8);
    return `<span>${label} ${time}</span>`;
  }).join('');
  document.getElementById('clocks').innerHTML = out;
}
setInterval(updateClocks,1000);
updateClocks();

// 计算统计
function todayISO(){ return new Date().toISOString().slice(0,10); }
function computeStats(){
  const cost = positions.reduce((s,p)=>s + p.qty * p.avgPrice, 0);
  const value= positions.reduce((s,p)=>s + p.qty * p.last, 0);
  const floating = value - cost;

  const today = todayISO();
  let todayReal=0, wins=0, losses=0;
  trades.filter(t=>t.closed && t.date===today).forEach(t=>{
    todayReal += t.pl;
    t.pl >= 0 ? wins++ : losses++;
  });
  const todayCount = trades.filter(t=>t.date===today).length;
  const totalCount = trades.length;
  const histReal = trades.filter(t=>t.closed).reduce((s,t)=>s + t.pl, 0);

  return { cost, value, floating, todayReal, wins, losses, todayCount, totalCount, histReal };
}

// 渲染 8 格统计
function renderStats(){
  const s = computeStats();
  const items = [
    ['账户总成本', fmtDollar(s.cost)],
    ['现有市值',   fmtDollar(s.value)],
    ['当前浮动盈亏', fmtDollar(s.floating)],
    ['当日已实现盈亏', fmtDollar(s.todayReal)],
    ['当日盈亏笔数',    fmtWL(s.wins, s.losses)],
    ['当日交易次数',    fmtInt(s.todayCount)],
    ['累计交易次数',    fmtInt(s.totalCount)],
    ['历史已实现盈亏', fmtDollar(s.histReal)]
  ];
  items.forEach(([title, html], idx)=>{
    const box = document.getElementById(`stat-${idx+1}`);
    box.innerHTML = `<div class="box-title">${title}</div><div class="box-value">${html}</div>`;
  });
}

// 渲染表格略...

// ---------------- 导入 / 导出 ----------------
window.addEventListener('DOMContentLoaded',()=>{
  // 导出 trades
  document.getElementById('export').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(trades,null,2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trades_export.json';
    a.click();
  });

  // 导入
  document.getElementById('import').addEventListener('click', ()=>{
    document.getElementById('file-input').click();
  });
  document.getElementById('file-input').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt){
      try {
        const data = JSON.parse(evt.target.result);
        if (!Array.isArray(data)) throw new Error('文件格式不正确');
        localStorage.setItem('trades', JSON.stringify(data));
        trades = data;       // 更新内存
        renderStats();       // 重新渲染
        // 如果有表格渲染，记得也调用重新渲染函数
      } catch(err){
        alert('导入失败：' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // 首次渲染
  renderStats();
  // renderPositions();
  // renderTrades();
});
