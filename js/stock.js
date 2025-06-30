
import {computeSymbolStats,loadTrades} from './utils.js'

const params=new URLSearchParams(window.location.search)
const symbol=params.get('symbol')
document.getElementById('title').textContent=symbol+' 交易详情'

const trades=loadTrades().filter(t=>t.symbol===symbol)
const tbl=document.getElementById('detail-table')
tbl.innerHTML='<tr><th>#</th><th>日期</th><th>星期</th><th>统计</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>盈亏平衡点</th><th>盈亏</th><th>当前持仓</th><th>持仓成本</th></tr>'
let weekdayNames=['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
let accumulator=[]
trades.forEach((t,idx)=>{
  accumulator.push(t)
  const res=computeSymbolStats(accumulator)
  const row=document.createElement('tr')
  const orderAmt=t.qty*t.price
  row.innerHTML=`<td>${idx+1}</td><td>${t.date}</td><td>${weekdayNames[new Date(t.date).getDay()]}</td><td>${idx+1}</td><td>${dirDisplay(t.direction)}</td><td>${Number(t.price).toFixed(2)}</td><td>${t.qty}</td><td>${orderAmt.toFixed(2)}</td><td>${res.avgCost?res.avgCost.toFixed(2):'0.00'}</td><td>${res.realized.toFixed(2)}</td><td>${res.qty}</td><td>${res.avgCost.toFixed(2)}</td>`
  tbl.appendChild(row)
})
const totalRealized=computeSymbolStats(trades).realized
document.getElementById('realized').textContent='历史已实现盈亏 $'+totalRealized.toFixed(2)

function dirDisplay(dir){
  if(dir==='BOUGHT')return 'BUY'
  if(dir==='SOLD')return 'SELL'
  return dir
}
