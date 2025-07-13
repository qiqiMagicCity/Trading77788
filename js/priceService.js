
// Simple real‑time price fetcher.
// It tries to read an API key from /KEY.txt (same origin).
// It keeps the latest quotes in window.lastQuotes and exposes getLast().

(function(){
    const REFRESH_SEC = 60;      // refresh interval
    const symbols = new Set();   // symbols that need quotes
    window.lastQuotes = window.lastQuotes || {};  // global cache

    async function loadKey(){
        try{
            const txt = await fetch('KEY.txt').then(r=>r.text());
            return txt.trim();
        }catch(e){console.error('priceService: KEY.txt not found'); return '';}
    }

    async function fetchQuote(alphaKey, symbol){
        // using AlphaVantage free endpoint
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaKey}`;
        const data = await fetch(url).then(r=>r.json());
        const price = parseFloat(data['Global Quote']['05. price']);
        if(!isNaN(price)){
            window.lastQuotes[symbol] = price;
        }
    }

    async function refresh(){
        const alphaKey = await loadKey();
        if(!alphaKey){return;}
        const promises = [];
        symbols.forEach(s=> promises.push(fetchQuote(alphaKey, s)));
        await Promise.all(promises);
        setTimeout(refresh, REFRESH_SEC*1000);
    }

    // Public API
    window.priceService = {
        track:(sym)=>{ symbols.add(sym); },
        getLast:(sym)=>{
            return window.lastQuotes[sym];
        }
    };

    refresh();
})();
