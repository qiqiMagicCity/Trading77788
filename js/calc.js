
function groupBy(arr,key){return arr.reduce((a,b)=>(a[b[key]]=a[b[key]]||[],a[b[key]].push(b),a),{});}
