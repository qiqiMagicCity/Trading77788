
const STORAGE_KEY = 'trading777_trades_v02';

function loadTrades() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('数据解析失败', e);
    return [];
  }
}

function saveTrades(trades) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  const status = document.getElementById('status');
  if (status) status.textContent = '已自动保存 ' + new Date().toLocaleTimeString();
}

// 导入 JSON 文件
function importJSONFile(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      if (Array.isArray(obj.trades)) {
        saveTrades(obj.trades);
        cb && cb(obj.trades);
      } else alert('JSON 结构错误，应包含 trades 数组');
    } catch (err) {
      alert('无法解析 JSON');
    }
  };
  reader.readAsText(file);
}

// 导出当前 trades
function exportJSON(trades) {
  const blob = new Blob([JSON.stringify({ trades }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trades_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// CRUD
function addTrade(trade) {
  const trades = loadTrades();
  trades.push(trade);
  saveTrades(trades);
  return trades;
}

function updateTrade(index, newTrade) {
  const trades = loadTrades();
  trades[index] = newTrade;
  saveTrades(trades);
  return trades;
}

function deleteTrade(index) {
  const trades = loadTrades();
  trades.splice(index, 1);
  saveTrades(trades);
  return trades;
}
