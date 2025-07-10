function sumPeriodStrict(startDate) {
  // 读取 close_prices.json
  if (!window.closePrices) {
    try {
      throw new Error("收盘价数据未加载");
    } catch (e) {
      alert("缺少 close_prices.json，请先导入/加载收盘价数据");
      return 0;
    }
  }
  const toISO = d => d.toISOString().slice(0,10);
  const today = new Date();
  const todayISO = toISO(today);
  let cur = new Date(startDate);
  let sum = 0;
  while (toISO(cur) <= todayISO) {
    const d = toISO(cur);
    // 1. 当日已实现盈亏
    const realized = trades.filter(t => t.closed && t.date === d).reduce((s, t) => s + (t.pl || 0), 0);

    // 2. 当日浮动盈亏
    let unreal = 0;
    const symbols = Array.from(new Set(trades.map(t => t.symbol)));
    for (const sym of symbols) {
      // 昨天未平仓历史仓
      let prevQty = 0, lots = [];
      trades.filter(t => t.symbol === sym && t.date < d)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(t => {
          if (t.side === 'BUY' || t.side === 'COVER') {
            let rem = t.qty;
            while (rem > 0 && lots.length && lots[0].qty < 0) {
              let opp = lots[0];
              let match = Math.min(rem, -opp.qty);
              opp.qty += match; rem -= match;
              if (opp.qty === 0) lots.shift();
            }
            if (rem > 0) lots.push({ qty: rem, price: t.price });
          } else if (t.side === 'SELL' || t.side === 'SHORT') {
            let rem = t.qty;
            while (rem > 0 && lots.length && lots[0].qty > 0) {
              let opp = lots[0];
              let match = Math.min(rem, opp.qty);
              opp.qty -= match; rem -= match;
              if (opp.qty === 0) lots.shift();
            }
            if (rem > 0) lots.push({ qty: -rem, price: t.price });
          }
        });
      prevQty = lots.reduce((s, l) => s + l.qty, 0);

      if (prevQty !== 0 && window.closePrices[d] && typeof window.closePrices[d][sym] === 'number') {
        // 前一日收盘价
        let prev = new Date(cur); prev.setDate(cur.getDate()-1);
        let prevD = toISO(prev);
        while ((!window.closePrices[prevD] || typeof window.closePrices[prevD][sym] !== 'number') && prevD >= toISO(startDate)) {
          prev.setDate(prev.getDate() - 1); prevD = toISO(prev);
        }
        if (window.closePrices[prevD] && typeof window.closePrices[prevD][sym] === 'number') {
          unreal += (window.closePrices[d][sym] - window.closePrices[prevD][sym]) * prevQty;
        }
      }
      // 当天新买未卖部分
      const todayTrades = trades.filter(t => t.symbol === sym && t.date === d);
      let dayNet = 0, dayCost = 0;
      for (const t of todayTrades) {
        const signed = (t.side === 'BUY' || t.side === 'COVER') ? t.qty : -t.qty;
        dayNet += signed;
        dayCost += signed * t.price;
      }
      if (dayNet !== 0 && window.closePrices[d] && typeof window.closePrices[d][sym] === 'number') {
        let avgCost = dayNet ? dayCost / dayNet : 0;
        unreal += (window.closePrices[d][sym] - avgCost) * dayNet;
      }
    }
    sum += realized + unreal;
    cur.setDate(cur.getDate() + 1);
  }
  return sum;
}
