// 导出功能
document.getElementById('export').addEventListener('click',()=>{
  const blob = new Blob([JSON.stringify(trades,null,2)],{type:"application/json"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'trades_export.json';
  a.click();
});

// 导入功能
document.getElementById('import').addEventListener('click',()=>{
  document.getElementById('file-input').click();
});
document.getElementById('file-input').addEventListener('change',(e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try {
      const data = JSON.parse(evt.target.result);
      if(!Array.isArray(data)) throw new Error('格式错误');
      localStorage.setItem('trades', JSON.stringify(data));
      location.reload();
    } catch(err){
      alert('导入失败：'+err.message);
    }
  };
  reader.readAsText(file);
});
