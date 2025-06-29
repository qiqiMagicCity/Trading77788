
const STORAGE='trades';
function load(){return JSON.parse(localStorage.getItem(STORAGE)||'[]');}
function save(d){localStorage.setItem(STORAGE,JSON.stringify(d));}
