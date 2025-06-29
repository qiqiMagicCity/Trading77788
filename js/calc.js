// calc.js - formatting utilities and formula helpers
function fmtSign(n){
    const cls = n>0 ? 'green' : n<0 ? 'red' : 'white';
    const formatted = Number(Math.abs(n)).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    return `<span class="${cls}">${formatted}</span>`;
}
function fmtDollar(n){
    // prepend $ and apply sign color
    if(n === 0) return '<span class="white">$ 0.00</span>';
    const cls = n>0 ? 'green' : 'red';
    const formatted = Number(Math.abs(n)).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    return `<span class="${cls}">$ ${formatted}</span>`;
}
function fmtInt(n){
    return `<span class="white">${n}</span>`;
}
function fmtWL(w,l){
    return `<span class="green">W${w}</span>/<span class="red">L${l}</span>`;
}
