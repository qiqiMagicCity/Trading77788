
const FINNHUB_TOKEN = 'd19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
const priceCache = {};

// 获取实时价格（简易实现，未处理错误及速率）
async function fetchPrice(ticker){
  if(priceCache[ticker]) return priceCache[ticker];
  try{
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_TOKEN}`);
    const data = await res.json();
    const price = data.c || 0;
    priceCache[ticker] = price;
    return price;
  }catch(e){
    console.error('取价失败', e);
    return 0;
  }
}

function groupByTicker(trades){
  return trades.reduce((acc,t)=>{
    acc[t.ticker] = acc[t.ticker]||[];
    acc[t.ticker].push(t);
    return acc;
  },{});
}

// 计算持仓（买卖/做空/回补）
function computePosition(trades){
  let netQty = 0;
  let totalCost = 0;
  trades.forEach(t=>{
    const qty = Number(t.quantity);
    const price = Number(t.price);
    if(t.type==='buy' || t.type==='cover'){
      totalCost += price*qty;
      netQty += qty;
    }else if(t.type==='sell' || t.type==='short'){
      totalCost -= price*qty;
      netQty -= qty;
    }
  });
  const avgCost = netQty!==0? totalCost/netQty : 0;
  return {netQty,avgCost,totalCost};
}

// 统计框指标
async function computeDashboardMetrics(trades){
  const todayStr = new Date().toISOString().slice(0,10);
  const group = groupByTicker(trades);

  let accountCost=0, currentValue=0, unreal=0;
  const rows=[];
  for(const k in group){
    const pos = computePosition(group[k]);
    if(pos.netQty===0) continue;
    accountCost += pos.avgCost*pos.netQty;
    const price = await fetchPrice(k);
    const u = (price - pos.avgCost)*pos.netQty;
    unreal += u;
    currentValue += price*pos.netQty;
    rows.push({ticker:k, ...pos, price, unreal:u});
  }

  // 当日指标
  const todays = trades.filter(t=>t.date===todayStr);
  const dayTradeCount = todays.length;

  let dayRealizedPL = 0;
  let dayRealizedPairs = 0;

  const tempMap={};
  todays.forEach(t=>{
    tempMap[t.ticker]=tempMap[t.ticker]||[];
    tempMap[t.ticker].push({...t});
  });

  // 以 FIFO 匹配日内平仓
  Object.values(tempMap).forEach(arr=>{
    arr.sort((a,b)=>a.date.localeCompare(b.date));
    const stack=[];
    arr.forEach(tr=>{
      if(tr.type==='buy' || tr.type==='cover'){
        stack.push(tr);
      }else if(tr.type==='sell' || tr.type==='short'){
        let qty=tr.quantity;
        while(qty>0 && stack.length>0){
          const open=stack.shift();
          const matchQty=Math.min(qty,open.quantity);
          qty-=matchQty;
          const pl = (tr.price - open.price)*(open.type==='buy'?matchQty:-matchQty);
          dayRealizedPL += pl;
          dayRealizedPairs +=1;
          if(open.quantity>matchQty){
            open.quantity-=matchQty;
            stack.unshift(open);
          }
        }
      }
    });
  });

  const totalRealizedPL = computeTotalRealized(trades);

  return {
    rows, accountCost, currentValue, unreal,
    dayRealizedPL, dayRealizedPairs, dayTradeCount,
    totalTrades: trades.length,
    totalRealizedPL
  };
}

function computeTotalRealized(trades){
  // naive: realized when position returns to zero any day
  let realized=0;
  const map=groupByTicker(trades);
  for(const k in map){
    const tickerTrades=map[k].sort((a,b)=>a.date.localeCompare(b.date));
    const stack=[];
    tickerTrades.forEach(tr=>{
      if(tr.type==='buy' || tr.type==='cover'){
        stack.push(tr);
      }else{
        // sell or short closing positions
        let qty=tr.quantity;
        while(qty>0 && stack.length>0){
          const open=stack.shift();
          const matchQty=Math.min(qty,open.quantity);
          qty-=matchQty;
          const pl = (tr.price - open.price)*(open.type==='buy'?matchQty:-matchQty);
          realized += pl;
          if(open.quantity>matchQty){
            open.quantity-=matchQty;
            stack.unshift(open);
          }
        }
      }
    });
  }
  return realized;
}
