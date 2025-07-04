// js/symbols.js

// —— 同步写死的常用对照（保留你原来常用的几个）  
window.SymbolCN = {
  AAPL: '苹果',
  TSLA: '特斯拉',
  // …其它写死的对照项…
};

// —— 异步加载 public 下的对照表，并禁止浏览器缓存 ——  
;(async () => {
  try {
    const res = await fetch('/symbol_name_map.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const map = await res.json();

    // 合并对照：不会覆盖写死的，只添加/更新你 JSON 里的条目
    Object.assign(window.SymbolCN, map);

    // 拿到对照后，立刻二次渲染
    if (typeof window.refreshAll === 'function')      window.refreshAll();
    if (typeof window.renderAllTrades === 'function') window.renderAllTrades();

  } catch (e) {
    console.error('加载 symbol_name_map.json 失败：', e);
  }
})();
