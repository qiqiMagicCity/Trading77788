
import {loadTrades,saveTrades,computeSymbolStats} from './utils.js'

const tbl=document.getElementById('all-trades')
const modal=document.getElementById('modal')
const title=document.getElementById('modal-title')
const inputDate=document.getElementById('input-date')
const inputSymbol=document.getElementById('input-symbol')
const inputDir=document.getElementById('input-direction')
const inputQty=document.getElementById('input-qty')
const inputPrice=document.getElementById('input-price')
const btnAdd=document.getElementById('btn-add')
const btnCancel=document.getElementById('btn-cancel')
const btnConfirm=document.getElementById('btn-confirm')

let trades=loadTrades()
let editingIndex=-1

render()

btnAdd.onclick=()=>{
  editingIndex=-1
  title.textContent='添加交易'
  inputDate.value=new Date().toISOString().slice(0,16)
  inputSymbol.value=''
  inputDir.value='BUY'
  inputQty.value=''
  inputPrice.value=''
  modal.style.display='block'
}

btnCancel.onclick=()=>modal.style.display='none'

btnConfirm.onclick=()=>{
  const dirDisplay=inputDir.value
  const direction=dirDisplay==='BUY'?'BOUGHT':dirDisplay==='SELL'?'SOLD':dirDisplay // SHORT COVER unchanged
  const trade={
    date:inputDate.value.slice(0,10),
    symbol:inputSymbol.value.trim().toUpperCase(),
    direction,
    price:parseFloat(inputPrice.value),
    qty:parseFloat(inputQty.value)
  }
  if(editingIndex>-1){
    trades[editingIndex]=trade
  }else{
    trades.push(trade)
  }
  saveTrades(trades)
  modal.style.display='none'
  render()
  // force dashboard recalculation if open
  if(window.opener)window.opener.location.reload()
}

function render(){
  tbl.innerHTML='<tr><th>#</th><th>日期</th><th>代码</th><th>方向</th><th>单价</th><th>数量</th><th>订单金额</th><th>盈亏</th><th>编辑</th><th>删除</th></tr>'
  trades.forEach((t,i)=>{
    const tr=document.createElement('tr')
    const dirDisp= t.direction==='BOUGHT'?'BUY':t.direction==='SOLD'?'SELL':t.direction
    const orderAmt=t.qty*t.price
    const res=computeSymbolStats(trades.slice(0,i+1))
    tr.innerHTML=`<td>${i+1}</td><td>${t.date}</td><td>${t.symbol}</td><td>${dirDisp}</td><td>${t.price.toFixed(2)}</td><td>${t.qty}</td><td>${orderAmt.toFixed(2)}</td><td>${res.realized.toFixed(2)}</td><td><button class="edit">编辑</button></td><td><button class="del">删除</button></td>`
    tr.querySelector('.edit').onclick=()=>{
      editingIndex=i
      title.textContent='编辑交易'
      inputDate.value=t.date+'T00:00'
      inputSymbol.value=t.symbol
      inputDir.value=dirDisp
      inputQty.value=t.qty
      inputPrice.value=t.price
      modal.style.display='block'
    }
    tr.querySelector('.del').onclick=()=>{
      if(confirm('确定删除该笔交易?')){
        trades.splice(i,1)
        saveTrades(trades)
        render()
        if(window.opener)window.opener.location.reload()
      }
    }
    tbl.appendChild(tr)
  })
}
