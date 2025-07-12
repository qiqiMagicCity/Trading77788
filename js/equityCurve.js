// Equity curve

function loadCurve() {
  return loadData('equity_curve', '[]');
}

function saveCurve(data) {
  saveData('equity_curve', data);
}

function sumPeriod(startDate, endDate) {
  const curve = loadCurve();
  const trades = loadData('trades', '[]');
  // Sum real + unreal for period
  let sum = 0;
  // Implement
  return sum;
}