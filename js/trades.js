(function(){
  const tbl = document.getElementById('all-trades');

  function render(){
    let trades = JSON.parse(localStorage.getItem('trades') || '[]');
    trades.sort((a, b) => new Date(b.date) - new Date(a.date));
    trades = window.FIFO ? window.FIFO.computeFIFO(trades) : trades;

    const head = ['#','代码','中文','日期','星期','统计','方向','单价','数量','订单金额','盈亏平衡点','盈亏','详情','目前持仓','持仓成本','编辑','删除'];
    tbl.innerHTML = '<tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr>';

    let histReal = 0;
    trades.forEach((t, i) => {
      const be     = isFinite(t.be) ? t.be.toFixed(2) : '';
      const plCls  = t.pl > 0 ? 'green' : t.pl < 0 ? 'red' : 'white';
      const plStr  = isFinite(t.pl) ? t.pl.toFixed(2) : '';
      histReal    += t.pl || 0;

      tbl.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td>${t.symbol}</td>
          <!-- 这里使用 window.SymbolCN 映射 -->
          <td>${window.SymbolCN[t.symbol] || ''}</td>
          <td>${t.date}</td>
          <td>${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(t.date).getDay()]}</td>
          <td>${t.count}</td>
          <td>${t.side}</td>
          <td>${t.price.toFixed(2)}</td>
          <td>${t.qty}</td>
          <td>${t.amount.toFixed(2)}</td>
          <td>${be}</td>
          <td class="${plCls}">${plStr}</td>
          <td><a href="stock.html?symbol=${t.symbol}" class="details">详情</a></td>
          <td>${t.afterQty}</td>
          <td>${isFinite(t.avgCost) ? t.avgCost.toFixed(2) : ''}</td>
          <td><button data-edit="${i}">编辑</button></td>
          <td><button data-del="${i}">删除</button></td>
        </tr>`);
    });

    // 历史已实现盈亏 Footer
    const footer = document.createElement('tr');
    footer.innerHTML = `
      <td colspan="9">历史已实现盈亏</td>
      <td class="${histReal > 0 ? 'green' : histReal < 0 ? 'red' : 'white'}">
        ${histReal.toFixed(2)}
      </td>
      <td colspan="4"></td>`;
    tbl.appendChild(footer);

    // 绑定编辑/删除按钮事件
    tbl.querySelectorAll('button[data-del]').forEach(btn => {
      btn.onclick = () => {
        const idx = +btn.getAttribute('data-del');
        const arr = JSON.parse(localStorage.getItem('trades') || '[]');
        arr.splice(idx, 1);
        localStorage.setItem('trades', JSON.stringify(arr));
        render();
      };
    });
    tbl.querySelectorAll('button[data-edit]').forEach(btn => {
      btn.onclick = () => {
        const idx = +btn.getAttribute('data-edit');
        localStorage.setItem('editIndex', idx);
        location.href = 'index.html#edit';
      };
    });
  }

  // —— 关键：只暴露给 symbols.js 在映射加载完后调用 ——  
  window.refreshAll      = render;
  window.renderAllTrades = render;

  // 注意：已移除首次 render()，避免异步映射前空渲染
})();
