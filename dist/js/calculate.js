
/**
 * Basic calculation helpers.
 * You can modify these functions to implement your own formulas.
 */

function groupByTicker(trades){
    return trades.reduce((acc,t)=>{
        acc[t.ticker] = acc[t.ticker]||[];
        acc[t.ticker].push(t);
        return acc;
    },{});
}

function computePosition(tradesForTicker){
    let netQty = 0;
    let totalCost = 0;
    tradesForTicker.forEach(t=>{
        const qty = Number(t.quantity);
        const price = Number(t.price);
        if(t.type==='buy' || t.type==='cover' ){
            totalCost += price*qty + (Number(t.fee)||0);
            netQty += qty;
        }else if(t.type==='sell' || t.type==='short'){
            totalCost -= price*qty - (Number(t.fee)||0);
            netQty -= qty;
        }
    });
    const avgCost = netQty!==0 ? totalCost/netQty : 0;
    return {netQty,avgCost};
}

function computePortfolioMetrics(trades){
    const map = groupByTicker(trades);
    let totalMarketValue = 0;
    let unreal = 0;
    const resultRows = [];
    for(const ticker in map){
        const position = computePosition(map[ticker]);
        const price = getMockMarketPrice(ticker); // placeholder
        const pl = (price - position.avgCost)*position.netQty;
        unreal += pl;
        totalMarketValue += price*position.netQty;
        resultRows.push({ticker,...position,price,unreal:pl});
    }
    return {rows:resultRows,totalMarketValue,unreal};
}

/* Placeholder for live price; returns random near avgCost */
function getMockMarketPrice(ticker){
    return 100 + (ticker.charCodeAt(0)%30); // simple deterministic stub
}
