
export function nowNY(){
  const local=new Date();
  const utcMs=local.getTime()+local.getTimezoneOffset()*60000;
  const offset=-4*3600000; // EDT
  return new Date(utcMs+offset);
}
