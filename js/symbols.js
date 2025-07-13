// Symbols Chinese mapping

window.SymbolCN = {};

(function() {
  fetch('./data/symbol_name_map.json?' + Date.now())
    .then(r => r.json())
    .then(map => {
      Object.assign(window.SymbolCN, map);
    })
    .catch(console.error);
})();