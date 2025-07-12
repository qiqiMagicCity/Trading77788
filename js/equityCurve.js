// Equity curve module

function loadCurve() {
  return loadData('equity_curve', '[]');
}

function saveCurve(data) {
  saveData('equity_curve', data);
}

function sumPeriod(startDate) {
  const curve = loadCurve();
  const trades = loadData('trades', '[]');
  // Implement sum for M11-M13
  return 0;
}