
const TOKEN='d19cvm9r01qmm7tudrk0d19cvm9r01qmm7tudrkg';
const priceCache={};
async function getPrice(tk){
 if(priceCache[tk]) return priceCache[tk];
 try{
  const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${tk}&token=${TOKEN}`);
  const d=await r.json();priceCache[tk]=d.c||0;return priceCache[tk];
 }catch(e){return 0;}
}
/**
FIFO + 单方向滚动摊薄成本
返回：netQty, avgCost, histPL, breakeven
*/
function fifoMetrics(trades){
 let direction='NONE',lots=[],accPL=0;
 trades.sort((a,b)=>a.date.localeCompare(b.date));
 const EPS=1e-6;
 trades.forEach(t=>{
   let q=t.quantity, p=t.price;
   if(t.type==='buy'){
     if(direction==='NONE'||direction==='LONG'){lots.push({p,q});direction='LONG';}
     else{ // SHORT->buy 回补
       while(q>EPS&&lots.length){
         let lot=lots[0];const c=Math.min(q,lot.q);
         accPL+=(lot.p-p)*c;
         lot.q-=c;q-=c;if(lot.q<=EPS)lots.shift();
       }
       if(q>EPS){lots=[{p,q}];direction='LONG';}
       else if(!lots.length) direction='NONE';
     }
   }else if(t.type==='sell'){
     if(direction==='NONE'||direction==='SHORT'){lots.push({p,q});direction='SHORT';}
     else{
       while(q>EPS&&lots.length){
         let lot=lots[0];const c=Math.min(q,lot.q);
         accPL+=(p-lot.p)*c;
         lot.q-=c;q-=c;if(lot.q<=EPS)lots.shift();
       }
       if(q>EPS){lots=[{p,q}];direction='SHORT';}
       else if(!lots.length) direction='NONE';
     }
   }else if(t.type==='short'){ // 开空
     lots.push({p,q});direction='SHORT';
   }else if(t.type==='cover'){ // 回补
     while(q>EPS&&lots.length){
       let lot=lots[0];const c=Math.min(q,lot.q);
       accPL+=(lot.p-p)*c;
       lot.q-=c;q-=c;if(lot.q<=EPS)lots.shift();
     }
     if(!lots.length) direction='NONE';
   }
 });
 const totalQty=lots.reduce((s,l)=>s+l.q,0);
 const sumCost=lots.reduce((s,l)=>s+l.p*l.q,0);
 return {netQty:direction==='SHORT'? -totalQty:totalQty,
         avgCost:totalQty?sumCost/totalQty:0,
         histPL:accPL,
         breakeven:totalQty? (sumCost-accPL)/totalQty:0};
}

/**
今日已实现盈亏 & 今日盈亏笔数
算法：将同一 ticker 当日 buy/sell、short/cover 依数量 FIFO 配对
*/
function todayRealized(trades,todayStr){
 const today=trades.filter(t=>t.date===todayStr);
 let realized=0,pairs=0;
 const map = today.reduce((m,t)=>(m[t.ticker]=m[t.ticker]||[],m[t.ticker].push({...t}),m),{});
 Object.values(map).forEach(arr=>{
   arr.sort((a,b)=>a.type.localeCompare(b.type)); // just to ensure deterministic
   const stack=[];
   arr.forEach(t=>{
     if(t.type==='buy'||t.type==='cover') stack.push({...t});
     else{
       let qty=t.quantity;
       while(qty>0&&stack.length){
         const open=stack[0];
         const c=Math.min(qty,open.quantity);
         const pl=(t.price-open.price)*(open.type==='buy'?c:-c);
         realized+=pl;pairs+=1;
         open.quantity-=c;qty-=c;if(open.quantity<=0) stack.shift();
       }
     }
   });
 });
 return {realized:Number(realized.toFixed(2)), pairs};
}

// 千分位 + 保留两位
function fmt(n){return Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});}

export {getPrice, fifoMetrics, todayRealized, fmt};
