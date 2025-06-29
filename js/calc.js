// === 计算工具 ===
const FINNHUB_KEY = ''; // 可自行替换

async function getPrice(ticker){
  try{
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.c || 0; // current price
  }catch(e){
    console.error('价格获取失败', e);
    return 0;
  }
}

// FIFO metrics for one ticker array
function fifoMetrics(trades){
  // trades: [{date, type, price, quantity}]
  // We'll process buys vs sells etc.
  let positionList = [];
  let netQty=0;
  let realized=0;
  const EPS=1e-9;
  for(const t of trades.sort((a,b)=>new Date(a.date)-new Date(b.date))){
    let qty=t.quantity;
    if(t.type==='buy'){ // long increase
      positionList.push({price:t.price,qty});
      netQty+=qty;
    }else if(t.type==='sell'){ // long decrease
      let rem=qty;
      while(rem>EPS && positionList.length){
        const lot=positionList[0];
        const c=Math.min(rem,lot.qty);
        realized += (t.price - lot.price)*c;
        lot.qty-=c;
        netQty-=c;
        rem-=c;
        if(lot.qty<=EPS) positionList.shift();
      }
    }else if(t.type==='short'){ // open short
      positionList.push({price:t.price,qty:-qty});
      netQty-=qty;
    }else if(t.type==='cover'){ // close short
      let rem=qty;
      while(rem>EPS && positionList.length){
        const lot=positionList[0];
        const c=Math.min(rem,Math.abs(lot.qty));
        realized += (lot.price - t.price)*c; // short profit
        lot.qty+=c;
        netQty+=c;
        rem-=c;
        if(Math.abs(lot.qty)<=EPS) positionList.shift();
      }
    }
  }
  let totalQty=positionList.reduce((s,l)=>s+Math.abs(l.qty),0);
  let avgCost = totalQty>EPS ? positionList.reduce((s,l)=>s+l.price*Math.abs(l.qty),0)/totalQty : 0;
  return {netQty,avgCost,realized};
}

// 格式化
function fmt(n){
  const str = (Number(n)||0).toFixed(2);
  if(n>0) return `<span class="green">${str}</span>`;
  if(n<0) return `<span class="red">${str}</span>`;
  return `<span class="gray">${str}</span>`;
}
