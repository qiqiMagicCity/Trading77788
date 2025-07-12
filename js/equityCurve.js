// Equity curve management

function loadCurve() {
  return safeCall(() => loadData('equityCurve', '[]'), []);
}

function saveCurve(data) {
  saveData('equityCurve', data);
}

// Sum for periods
function sumPeriod(startDate) {
  // Logic as per rules
}