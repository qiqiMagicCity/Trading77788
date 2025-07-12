// Shared utilities

// Data load/save
function loadData(key, defaultValue = '[]') {
  try {
    return JSON.parse(localStorage.getItem(key) || defaultValue);
  } catch (e) {
    console.error('Load error: ' + key, e);
    return JSON.parse(defaultValue);
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Save error: ' + key, e);
  }
}

// Formatting
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

// Date helpers
const NY_TZ = 'America/New_York';
const nyNow = () => {
  if (typeof luxon !== 'undefined') return luxon.DateTime.now().setZone(NY_TZ);
  const d = new Date();
  const offset = -4 * 60;
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + offset);
  return d;
};
const todayNY = () => nyNow().toISOString().slice(0, 10);

function getWeekIdx(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1]-1, parts[2]).getDay();
}

// Safe call
function safeCall(fn, defaultValue = null) {
  try {
    return fn();
  } catch (e) {
    console.error('Safe call error', e);
    return defaultValue;
  }
}

// Export/Import prices
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

// Wire buttons
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-prices');
  if (exportBtn) exportBtn.addEventListener('click', exportPrices);
  const importBtn = document.getElementById('import-prices');
  if (importBtn) importBtn.addEventListener('click', importPrices);
});