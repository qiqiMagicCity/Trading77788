
(function(){
  const STORAGE_KEY = 'equity_curve';

  function loadCurve(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }catch(e){
      return [];
    }
  }

  function saveCurve(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function exportCurve(){
    const blob = new Blob([JSON.stringify(loadCurve())], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equity_curve_' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  }

  function importCurve(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        localStorage.setItem(STORAGE_KEY, reader.result);
        alert('资金收益曲线已导入完成！');
      }catch(e){
        alert('导入失败: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  window.loadCurve = loadCurve;
  window.saveCurve = saveCurve;
  window.exportCurve = exportCurve;
  window.importCurve = importCurve;
})();
