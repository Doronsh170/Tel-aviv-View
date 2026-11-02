// Tel Aviv View: dedicated historical data Worker. Independent of momentum-yahoo-prices.
// IMPORTANT: deploy as a separate Worker; historical Yahoo data redistribution requires authorization.
const ROOT="https://query1.finance.yahoo.com/v8/finance/chart/";
const HEADERS={"access-control-allow-origin":"*","access-control-allow-methods":"GET,OPTIONS","content-type":"application/json;charset=utf-8","cache-control":"public,max-age=3600"};
const ALLOWED=/^[A-Z0-9^._-]{1,25}$/;
async function history(symbol){
  const url=ROOT+encodeURIComponent(symbol)+"?range=1y&interval=1d";
  const res=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"}});
  if(!res.ok)throw new Error("upstream HTTP "+res.status);
  const json=await res.json(),chart=json?.chart?.result?.[0];
  if(!chart)throw new Error(json?.chart?.error?.description||"empty chart");
  const timestamps=chart.timestamp||[], prices=chart.indicators?.quote?.[0]?.close||[];
  const dates=timestamps.map((t,i)=>({t:Number(t),c:Number(prices[i])})).filter(r=>Number.isFinite(r.t)&&Number.isFinite(r.c)&&r.c>0);
  if(dates.length<25)throw new Error("insufficient history");
  // Only completed past exchange days, never interpret an incomplete candle as daily closing price.
  const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jerusalem",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const clean=dates.filter(r=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jerusalem",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(r.t*1000))!==day);
  return {t:clean.map(r=>r.t),c:clean.map(r=>r.c),source:"Yahoo Finance",currency:chart.meta?.currency||null};
}
export default {async fetch(request){
  if(request.method==="OPTIONS")return new Response(null,{headers:HEADERS});
  const url=new URL(request.url),symbols=url.searchParams.get("tech");
  if(!symbols)return new Response(JSON.stringify({error:"missing tech"}),{status:400,headers:HEADERS});
  const syms=[...new Set(symbols.split(",").map(s=>s.trim().toUpperCase()))].slice(0,3);
  if(!syms.length||syms.some(s=>!ALLOWED.test(s)||!s.endsWith(".TA")))return new Response(JSON.stringify({error:"invalid TA symbols"}),{status:400,headers:HEADERS});
  const results=await Promise.allSettled(syms.map(history)),tech={},errors={};
  results.forEach((r,i)=>{if(r.status==="fulfilled")tech[syms[i]]=r.value;else errors[syms[i]]=String(r.reason?.message||r.reason)});
  return new Response(JSON.stringify({tech,errors,time:Math.floor(Date.now()/1000)}),{headers:HEADERS});
}};