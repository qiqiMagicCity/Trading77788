
// —— FIFO cost / PnL core (ported from Apps Script) ——
export function computeSymbolStats(trades){
  // trades: array for single symbol (chronological)
  const EPS = 1e-6
  let positionList = []
  let direction = 'NONE'
  let accRealized = 0
  let rowsOut = [] // For debugging

  function round2(n){return Number(n).toFixed(2)}
  function round6(n){return Number(n).toFixed(6)}

  trades.forEach(tr=>{
      const type=tr.direction
      const price=parseFloat(tr.price)
      const qty=parseFloat(tr.qty)
      let showPNL=0
      if(type==='BOUGHT'){
          if(direction==='NONE' || direction==='LONG'){
              positionList.push({price,qty})
              direction='LONG'
          }else{
              let rem=qty
              while(rem>EPS && positionList.length){
                  const lot=positionList[0]
                  const c=Math.min(rem,lot.qty)
                  showPNL+=(lot.price-price)*c
                  lot.qty-=c;rem-=c
                  if(lot.qty<=EPS)positionList.shift()
              }
              accRealized+=showPNL
              if(rem>EPS){
                  positionList=[{price,qty:rem}]
                  direction='LONG'
              }else if(!positionList.length){
                  direction='NONE'
              }
          }
      }else if(type==='SOLD' || type==='SHORT'){ // treat SOLD + SHORT alike wrt PNL sign
          if(direction==='NONE' || direction==='SHORT'){
              positionList.push({price,qty})
              direction='SHORT'
          }else{
              let rem=qty
              while(rem>EPS && positionList.length){
                  const lot=positionList[0]
                  const c=Math.min(rem,lot.qty)
                  showPNL+=(price-lot.price)*c
                  lot.qty-=c;rem-=c
                  if(lot.qty<=EPS)positionList.shift()
              }
              accRealized+=showPNL
              if(rem>EPS){
                  positionList=[{price,qty:rem}]
                  direction='SHORT'
              }else if(!positionList.length){
                  direction='NONE'
              }
          }
      }else if(type==='COVER'){
          // 'COVER' means buying back short positions; treat as BOUGHT when direction short
          if(direction==='SHORT'){
              let rem=qty
              while(rem>EPS && positionList.length){
                  const lot=positionList[0]
                  const c=Math.min(rem,lot.qty)
                  showPNL+=(lot.price-price)*c
                  lot.qty-=c;rem-=c
                  if(lot.qty<=EPS)positionList.shift()
              }
              accRealized+=showPNL
              if(rem>EPS){
                  // negative direction leftover? none as cover cannot open long here
                  positionList=[]
                  direction='NONE'
              }else if(!positionList.length){
                  direction='NONE'
              }
          }else{
              // treat as buy to open long if nothing to cover
              positionList.push({price,qty})
              direction='LONG'
          }
      }

      // post-row stats
      const totalQty = positionList.reduce((s,l)=>s+l.qty,0)
      let mVal=0,jVal=0
      if(totalQty>EPS){
          const sumCost = positionList.reduce((s,l)=>s+l.price*l.qty,0)
          mVal = sumCost/totalQty
          jVal = (sumCost-accRealized)/totalQty
      }
      const netAfter = direction==='SHORT'?-totalQty:totalQty
      rowsOut.push({
          pnl:round2(showPNL),
          j:round2(jVal),
          net:round6(netAfter),
          m:round2(mVal)
      })
  })
  // final summary
  const totalQty = positionList.reduce((s,l)=>s+l.qty,0)
  const posCost = positionList.reduce((s,l)=>s+l.price*l.qty,0)
  const avgCost = totalQty?posCost/totalQty:0
  return {
      direction,
      qty: direction==='SHORT'?-totalQty:totalQty,
      avgCost: avgCost,
      positionCost: posCost,
      realized: accRealized,
      debugRows: rowsOut
  }
}

// util to load / save local JSON file stored in localStorage
export function loadTrades(){
  try{
    return JSON.parse(localStorage.getItem('trades')||'[]')
  }catch(e){return []}
}
export function saveTrades(trades){
  localStorage.setItem('trades',JSON.stringify(trades))
}
