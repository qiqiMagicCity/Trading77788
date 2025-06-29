
// 计算与行情模块

const FINNHUB_KEY = 'd19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
const priceCache = {};

// 请求实时价格（收盘价 c）
async function getPrice(symbol) {
  symbol = symbol.toUpperCase();
  if(priceCache[symbol]) return priceCache[symbol];
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
    const r = await fetch(url);
    const js = await r.json();
    const p = js.c || 0;
    priceCache[symbol] = p;
    return p;
  } catch(e){
    console.error('price fetch',e);
    return 0;
  }
}

// 千分位 + 两位小数 + 颜色
function fmt(n){
  const cls = n>0?'green':(n<0?'red':'gray');
  return `<span class="${cls}">${Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
}

// FIFO 汇总指标
function fifoMetrics(trades){
  const posList=[];
  let direction='NONE';
  let accRealized=0;
  let EPS=1e-6;

  trades.forEach(t=>{
    const price=Number(t.price);
    let qty=Number(t.quantity);
    let showPNL=0;

    const isLongTrade = t.type==='buy'||t.type==='cover';
    const isShortTrade = t.type==='sell'||t.type==='short';

    if(isLongTrade){
      if(direction==='NONE'||direction==='LONG'){
        posList.push({price,qty});
        direction='LONG';
      } else {
        let rem=qty;
        while(rem>EPS && posList.length){
          let lot=posList[0],c=Math.min(rem,lot.qty);
          showPNL += (lot.price - price) * c;
          lot.qty -= c; rem -= c;
          if(lot.qty<=EPS) posList.shift();
        }
        accRealized += showPNL;
        if(rem>EPS){
          posList.push({price,qty:rem});
          direction='LONG';
        } else if(!posList.length){
          direction='NONE';
        }
      }
    } else if(isShortTrade){
      if(direction==='NONE'||direction==='SHORT'){
        posList.push({price,qty});
        direction='SHORT';
      } else {
        let rem=qty;
        while(rem>EPS && posList.length){
          let lot=posList[0],c=Math.min(rem,lot.qty);
          showPNL += (price - lot.price) * c;
          lot.qty -= c; rem -= c;
          if(lot.qty<=EPS) posList.shift();
        }
        accRealized += showPNL;
        if(rem>EPS){
          posList.push({price,qty:rem});
          direction='SHORT';
        } else if(!posList.length){
          direction='NONE';
        }
      }
    }
  });

  const totalQty = posList.reduce((s,l)=>s+l.qty,0);
  const sumCost = posList.reduce((s,l)=>s+l.price*l.qty,0);
  const avgCost = totalQty? sumCost/totalQty : 0;

  return {
    netQty: direction==='SHORT' ? -totalQty : totalQty,
    avgCost: avgCost,
    realized: accRealized,
    breakeven: totalQty? (sumCost - accRealized)/totalQty : 0
  };
}

// FIFO row‑by‑row 结果，用于个股页表格
function fifoRows(trades){
  const rows=[];
  const posList=[];
  let direction='NONE';
  let accRealized=0;
  let EPS=1e-6;
  let netAfter=0;

  trades.forEach((t,i)=>{
    const price=Number(t.price);
    let qty=Number(t.quantity);
    let showPNL=0;
    const isLongTrade = t.type==='buy'||t.type==='cover';
    const isShortTrade = t.type==='sell'||t.type==='short';

    if(isLongTrade){
      if(direction==='NONE'||direction==='LONG'){
        posList.push({price,qty});
        direction='LONG';
      } else {
        let rem=qty;
        while(rem>EPS && posList.length){
          let lot=posList[0],c=Math.min(rem,lot.qty);
          showPNL += (lot.price - price) * c;
          lot.qty -= c; rem -= c;
          if(lot.qty<=EPS) posList.shift();
        }
        accRealized += showPNL;
        if(rem>EPS){
          posList.push({price,qty:rem});
          direction='LONG';
        } else if(!posList.length){
          direction='NONE';
        }
      }
    } else if(isShortTrade){
      if(direction==='NONE'||direction==='SHORT'){
        posList.push({price,qty});
        direction='SHORT';
      } else {
        let rem=qty;
        while(rem>EPS && posList.length){
          let lot=posList[0],c=Math.min(rem,lot.qty);
          showPNL += (price - lot.price) * c;
          lot.qty -= c; rem -= c;
          if(lot.qty<=EPS) posList.shift();
        }
        accRealized += showPNL;
        if(rem>EPS){
          posList.push({price,qty:rem});
          direction='SHORT';
        } else if(!posList.length){
          direction='NONE';
        }
      }
    }

    const totalQty = posList.reduce((s,l)=>s+l.qty,0);
    netAfter = (direction==='SHORT' ? -totalQty : totalQty);
    const sumCost = posList.reduce((s,l)=>s+l.price*l.qty,0);
    const mVal = totalQty? sumCost/totalQty : 0;
    const breakeven = totalQty? (sumCost - accRealized)/totalQty : 0;

    rows.push({
      date:t.date,
      index:i+1,
      type:t.type,
      price:price,
      qty:qty,
      amount:price*qty,
      breakeven:breakeven,
      showPNL:showPNL,
      netAfter:netAfter,
      mVal:mVal,
      accRealized:accRealized
    });
  });
  return rows;
}
