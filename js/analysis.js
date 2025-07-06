
/* Trading777 交易分析 – v7.7.5 */
/* 功能区1：资金收益曲线（总账户每日收益变化） */
(async function(){
  /* ---------- Helper ---------- */
  function dateStr(ts){return new Date(ts).toISOString().slice(0,10);}
  function toTimestamp(date){return Math.floor(new Date(date+'T00:00:00').getTime()/1000);}
  function sum(arr){return arr.reduce((a,b)=>a+b,0);}
  /* ---------- Load trades ---------- */
  let trades = JSON.parse(localStorage.getItem('trades')||'[]');
  if(!trades.length){
    alert('请先在“全部交易记录”页面导入交易数据！');
    return;
  }
  /* ensure date field */
  trades.forEach(t=>{ t.date = t.date || t.time || t.datetime; });
  /* sort chronologically */
  trades.sort((a,b)=> new Date(a.date)-new Date(b.date));
  /* ---------- Prepare meta ---------- */
  const dates = [...new Set(trades.map(t=>t.date))].sort();
  const symbols = [...new Set(trades.map(t=>t.symbol))];
  


/* ---------- Finnhub token ---------- */
async function fetchFinnhubToken(){
    try{
        const txt = await (await fetch('/KEY.txt', {cache:'no-cache'})).text();
        const lines = txt.split(/?
/).filter(l=>l.trim());
        // 查找包含 finnhub 的行，或回退到任意疑似 token 的行
        for(const line of lines){
            if(/finnhub/i.test(line)){
                const m = line.match(/[a-z0-9]{20,40}/i);
                if(m){
                    let token = m[0];
                    // 若 token 为重复串 (前半部分与后半部分相同)，取前半
                    if(token.length%2===0){
                        const half = token.length/2;
                        if(token.slice(0,half)===token.slice(half)){
                            token = token.slice(0,half);
                        }
                    }
                    return token;
                }
            }
        }
        // fallback: 全文搜索
        const m = txt.match(/[a-z0-9]{20,40}/i);
        if(m) return m[0];
    }catch(e){
        console.warn('读取 KEY.txt 失败',e);
    }
    return 'demo'; // fallback 公共演示 token，速率受限
}
const token = await fetchFinnhubToken();


  /* ---------- Fetch daily close price for each symbol ---------- */
  const fromTs = toTimestamp(dates[0]) - 86400;
  const toTs   = toTimestamp(dates[dates.length-1]) + 86400;
  const priceMap = {}; // key: sym|date  value: close
  async function fetchCandles(sym){
      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${sym}&resolution=D&from=${fromTs}&to=${toTs}&token=${token}`;
      const res = await fetch(url);
      const json = await res.json();
      if(json && json.s==='ok'){
        json.t.forEach((ts,i)=>{
           const d = dateStr(ts*1000);
           priceMap[`${sym}|${d}`] = json.c[i];
        });
      }else{
        console.warn('价格缺失',sym,json);
      }
  }
  await Promise.all(symbols.map(fetchCandles));
  /* ---------- Compute account equity by day ---------- */
  const positions = {}; // sym -> {qty,avg}
  let cash = 0;
  const equity = {}; // date -> account value
  dates.forEach(d=>{
     // process trades of this date
     trades.filter(t=>t.date===d).forEach(t=>{
        const qty = Number(t.qty);
        const price = Number(t.price);
        const side = t.side.toUpperCase();
        const sym  = t.symbol;
        if(side==='BUY' || side==='COVER'){
           cash -= qty*price;
           const pos = positions[sym] || {qty:0,avg:0};
           const totalCost = pos.avg*pos.qty + qty*price;
           pos.qty += qty;
           pos.avg = pos.qty ? totalCost/pos.qty : 0;
           positions[sym]=pos;
        }else if(side==='SELL' || side==='SHORT'){
           cash += qty*price;
           const pos = positions[sym] || {qty:0,avg:0};
           pos.qty += (side==='SHORT'?-qty:-qty); // SHORT 开仓为负数量
           // avg cost we keep unchanged for simplicity
           positions[sym]=pos;
        }
        if(isFinite(t.pl)) cash += Number(t.pl); // 已实现盈亏
     });
     // mark-to-market
     let value = cash;
     for(const [sym,pos] of Object.entries(positions)){
        if(!pos.qty) continue;
        const close = priceMap[`${sym}|${d}`];
        if(close==null) continue;
        value += pos.qty * close;
     }
     equity[d]=value;
  });
  /* ---------- Derive daily net change ---------- */
  const labels = Object.keys(equity).sort();
  const dailyDelta = labels.map((d,i)=> i===0? 0 : (equity[d]-equity[labels[i-1]]));
  /* ---------- Render Chart ---------- */
  const ctx = document.getElementById('pnlCurve').getContext('2d');
  new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[{
         label:'每日净变动 ($)',
         data: dailyDelta,
         fill:false,
         tension:0.2,
         borderWidth:2
      }]
    },
    options:{
      responsive:true,
      scales:{
        x:{ticks:{color:'#94a3b8'}},
        y:{ticks:{color:'#94a3b8'}}
      },
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:(c)=>` $${c.parsed.y.toFixed(2)}`}}
      }
    }
  });
  /* ---------- Calendar heat map (optional) ---------- */
  if(window.FullCalendar){
     const calendarEl = document.getElementById('calendar');
     if(calendarEl){
        const events = labels.map(d=>({
           title:`${dailyDelta[labels.indexOf(d)]>0?'+':''}${dailyDelta[labels.indexOf(d)].toFixed(2)}`,
           start:d,
           color: dailyDelta[labels.indexOf(d)]>0 ? '#22c55e' : '#ef4444'
        }));
        const cal = new FullCalendar.Calendar(calendarEl,{
           initialView:'dayGridMonth',
           events
        });
        cal.render();
     }
  }
})();
