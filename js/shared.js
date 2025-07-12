// Shared utilities for all pages

// Data loading/saving
function loadData(key, defaultValue = '[]') {
  try {
    return JSON.parse(localStorage.getItem(key) || defaultValue);
  } catch (e) {
    console.error('Load data error for ' + key, e);
    return JSON.parse(defaultValue);
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Save data error for ' + key, e);
  }
}

// Formatting functions
const Utils = {
  fmtSign(n) {
    if (isNaN(n)) n = 0;
    const cls = n > 0 ? 'green' : n < 0 ? 'red' : 'white';
    const val = Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return `<span class="${cls}">${n < 0 ? '-' : ''}${val}</span>`;
  },
  fmtDollar(n) {
    return `$ ${this.fmtSign(n)}`;
  },
  fmtInt(n) {
    return `<span class="white">${Number(n || 0).toLocaleString()}</span>`;
  },
  fmtWL(w, l) {
    return `<span class="green">W${w || 0}</span>/<span class="red">L${l || 0}</span>`;
  },
  fmtPct(p) {
    return `<span class="white">${(p || 0).toFixed(1)}%</span>`;
  }
};

// Date helpers (fallback if luxon not loaded)
const NY_TZ = 'America/New_York';
const nyNow = () => {
  if (typeof luxon !== 'undefined') {
    return luxon.DateTime.now().setZone(NY_TZ);
  } else {
    const d = new Date();
    // Approximate ET offset
    const offset = -4 * 60; // ET UTC-4
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + offset);
    return d;
  }
};
const todayNY = () => nyNow().toISOString().slice(0, 10);

function getWeekIdx(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1]-1, parts[2]).getDay();
}

// Safe call wrapper
function safeCall(fn, defaultValue = null) {
  try {
    return fn();
  } catch (e) {
    console.error('Safe call error', e);
    return defaultValue;
  }
}

// Export prices
function exportPrices() {
  const data = loadData('close_prices', '{}');
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'close_prices.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import prices
function importPrices() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        saveData('close_prices', data);
        alert('导入成功');
        location.reload();
      } catch (err) {
        alert('导入失败: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Button wire for prices (if on page with IDs)
if (document.getElementById('export-prices')) {
  document.getElementById('export-prices').addEventListener('click', exportPrices);
}
if (document.getElementById('import-prices')) {
  document.getElementById('import-prices').addEventListener('click', importPrices);
}