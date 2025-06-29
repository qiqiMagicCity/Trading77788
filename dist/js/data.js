
/**
 * Simple data store using browser localStorage + optional JSON import/export
 * All trades stored in array of objects under STORAGE_KEY
 */
const STORAGE_KEY = 'trading777_trades';

function loadTrades() {
    const raw = localStorage.getItem(STORAGE_KEY);
    try {
        return raw ? JSON.parse(raw) : [];
    } catch(e){
        console.error('Failed to parse local data', e);
        return [];
    }
}

function saveTrades(trades) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    const status = document.getElementById('status');
    if(status) status.textContent = 'Auto‑saved at ' + new Date().toLocaleTimeString();
}

// Import JSON file
function importJSONFile(file, cb){
    const reader = new FileReader();
    reader.onload = e => {
        try{
            const obj = JSON.parse(e.target.result);
            if(Array.isArray(obj.trades)){
                saveTrades(obj.trades);
                cb && cb(obj.trades);
            } else {
                alert('Invalid JSON structure: missing "trades" array');
            }
        }catch(err){
            alert('Failed to parse JSON');
        }
    };
    reader.readAsText(file);
}

// Export current trades as JSON
function exportJSON(trades){
    const blob = new Blob([JSON.stringify({trades}, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trades_'+Date.now()+'.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Add new trade
function addTrade(trade){
    const trades = loadTrades();
    trades.push(trade);
    saveTrades(trades);
    return trades;
}

// Update trade by index
function updateTrade(index, newTrade){
    const trades = loadTrades();
    trades[index] = newTrade;
    saveTrades(trades);
    return trades;
}

// Delete trade by index
function deleteTrade(index){
    const trades = loadTrades();
    trades.splice(index,1);
    saveTrades(trades);
    return trades;
}
