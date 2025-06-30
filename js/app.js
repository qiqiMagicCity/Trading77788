
import {computeSymbolStats,loadTrades,saveTrades} from './utils.js'

const trades = loadTrades()
renderClock()
renderDashboard()

document.getElementById('btn-export').onclick = ()=>{
  const blob=new Blob([JSON.stringify(trades,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download='trades.json'
  a.click()
}

document.getElementById('btn-import').onclick = ()=>{
  const input=document.createElement('input')
  input.type='file'
  input.accept='.json'
  input.onchange=e=>{
    const file=e.target.files[0]
    if(!file)return
    const fr=new FileReader()
    fr.onload=evt=>{
      try{
        const data=JSON.parse(evt.target.result)
        if(Array.isArray(data)){
          saveTrades(data)
          window.location.reload()
        }
      }catch(e){alert('Invalid JSON')}
    }
    fr.readAsText(file)
  }
  input.click()
}

function renderClock(){
  function tick(){
    const now=new Date()
    const ny=now.toLocaleTimeString('en-US',{hour12:false,timeZone:'America/New_York'})
    const vl=now.toLocaleTimeString('en-US',{hour12:false,timeZone:'Europe/Madrid'})
    const sh=now.toLocaleTimeString('en-US',{hour12:false,timeZone:'Asia/Shanghai'})
    document.getElementById('clock').textContent=`纽约: ${ny} | 瓦伦西亚: ${vl} | 上海: ${sh}`
  }
  tick();setInterval(tick,1000)
}

function renderDashboard(){
  // KPI board
  const bySymbol={}
  trades.forEach(tr=>{
    if(!bySymbol[tr.symbol])bySymbol[tr.symbol]=[]
    bySymbol[tr.symbol].push(tr)
  })
  let totalCost=0,totalMarket=0,totalFloat=0,totalRealized=0,totalTrades=trades.length
  Object.keys(bySymbol).forEach(sym=>{
    const res=computeSymbolStats(bySymbol[sym])
    // For now latest price = average cost (no API)
    const price=res.avgCost || 0
    const marketVal = price*res.qty
    totalMarket+=marketVal
    totalCost+=res.positionCost
    totalFloat+=(price-res.avgCost)*res.qty
    totalRealized+=res.realized
  })
  const kpi=document.getElementById('kpi-board')
  kpi.innerHTML=''
  const cards=[
    {label:'账户总成本',val:`$ ${totalCost.toFixed(2)}`},
    {label:'现有市值',val:`$ ${totalMarket.toFixed(2)}`},
    {label:'当前浮动盈亏',val:`$ ${totalFloat.toFixed(2)}`},
    {label:'历史已实现盈亏',val:`$ ${totalRealized.toFixed(2)}`},
    {label:'累计交易次数',val:totalTrades}
  ]
  cards.forEach(c=>{
    const div=document.createElement('div')
    div.className='kpi-card'
    div.innerHTML=`<div>${c.label}</div><div class="kpi-val">${c.val}</div>`
    kpi.appendChild(div)
  })

  renderPositions(bySymbol)
  renderTrades(trades)
}

function renderPositions(bySymbol){
  const tbl=document.getElementById('position-table')
  tbl.innerHTML='<tr><th>代码</th><th>实时价格</th><th>目前持仓</th><th>持仓单价</th><th>持仓金额</th></tr>'
  Object.keys(bySymbol).forEach(sym=>{
    const res=computeSymbolStats(bySymbol[sym])
    if(res.qty===0)return
    const price=res.avgCost || 0
    const tr=document.createElement('tr')
    tr.innerHTML=`<td>${sym}</td><td>${price.toFixed(2)}</td><td>${res.qty}</td><td>${res.avgCost.toFixed(2)}</td><td>${(price*res.qty).toFixed(2)}</td>`
    tbl.appendChild(tr)
  })
}

function renderTrades(trades){
  const tbl=document.getElementById('trade-table')
  tbl.innerHTML='<tr><th>日期</th><th>代码</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>详情</th></tr>'
  trades.forEach((t,i)=>{
    const tr=document.createElement('tr')
    tr.innerHTML=`<td>${t.date}</td><td>${t.symbol}</td><td>${dirDisplay(t.direction)}</td><td>${Number(t.price).toFixed(2)}</td><td>${t.qty}</td><td>${(t.qty*t.price).toFixed(2)}</td><td><a href="stock.html?symbol=${t.symbol}" target="_blank">详情</a></td>`
    tbl.appendChild(tr)
  })
}

function dirDisplay(dir){
  if(dir==='BOUGHT')return 'BUY'
  if(dir==='SOLD')return 'SELL'
  return dir
}
