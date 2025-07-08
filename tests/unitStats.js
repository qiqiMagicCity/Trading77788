// tests/unitStats.js
// Basic sanity tests for stats() using sample trades & positions
(function(){
  const posArr = [
    {symbol:'AAPL', qty: 100, avgPrice: 150, last:160, prevClose:155, priceOk:true},
    {symbol:'TSLA', qty:-50, avgPrice:700, last:680, prevClose:690, priceOk:true}
  ];
  const tradesArr = [
    {symbol:'AAPL', date: luxon.DateTime.now().setZone('America/New_York').toISODate(), side:'SELL', qty:20, price:160, pl:200, closed:true},
    {symbol:'TSLA', date: luxon.DateTime.now().setZone('America/New_York').toISODate(), side:'COVER', qty:10, price:680, pl:200, closed:true}
  ];
  const s = stats.bind({})(posArr, tradesArr);  // using call override
  console.assert(Math.abs(s.cost - (100*150 + 50*700)) < 1e-6, 'Cost wrong');
  console.assert(Math.abs(s.value - (100*160 + 50*680)) < 1e-6, 'Value wrong');
})();
