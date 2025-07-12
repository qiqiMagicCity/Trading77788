// Shared utilities for all pages

// Data loading/saving
function loadData(key, defaultValue) {
  try {
    return JSON.parse(localStorage.getItem(key) || defaultValue);
  } catch (e) {
    console.error('Load data error for ' + key, e);
    return defaultValue;
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
    const cls = n > 0 ? 'green' : n < 0 ? 'red' : 'white';
    const val = Math.abs(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return `<span class="${cls}">${n < 0 ? '-' : ''}${val}</span>`;
  },
  fmtDollar(n) {
    return `$ ${this.fmtSign(n)}`;
  },
  fmtInt(n) {
    return `<span class="white">${Number(n).toLocaleString()}</span>`;
  },
  fmtWL(w, l) {
    return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`;
  },
  fmtPct(p) {
    return `<span class="white">${Number(p).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})}%</span>`;
  }
};

// Date helpers (fallback if luxon/dayjs not loaded)
const NY_TZ = 'America/New_York';
const nyNow = () => {
  if (typeof luxon !== 'undefined') {
    return luxon.DateTime.now().setZone(NY_TZ);
  } else {
    return new Date(); // fallback
  }
};
const todayNY = () => nyNow().toISODate().slice(0, 10);

function getWeekIdx(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1]-1, parts[2])).getUTCDay();
}

// Error handling wrapper
function safeCall(fn, defaultValue) {
  try {
    return fn();
  } catch (e) {
    console.error('Error in function call', e);
    return defaultValue || null;
  }
}

// Export prices
function exportPrices() {
  const data = loadData('close_prices', '{}');
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'close_prices_' + Date.now() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Import prices
function importPrices() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        saveData('close_prices', data);
        alert('收盘价格导入成功!');
        // Refresh pages if needed
      } catch (err) {
        alert('导入失败: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Wire buttons if on page
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('export-prices')?.addEventListener('click', exportPrices);
  document.getElementById('import-prices')?.addEventListener('click', importPrices);
});