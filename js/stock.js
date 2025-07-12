// Stock logic

function renderStockDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const symbol = urlParams.get('symbol');
  document.getElementById('symbol-title').innerHTML = symbol + ' 详情';
  // Render details and table for symbol
}

document.addEventListener('DOMContentLoaded', renderStockDetails);