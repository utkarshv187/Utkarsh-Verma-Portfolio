import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
for (const W of [1024, 810, 768, 390]){
  const p = await (await b.newContext({ viewport:{width:W,height:900} })).newPage();
  await p.goto('https://uxuiuv.framer.website/',{waitUntil:'load'}).catch(()=>{});
  await p.waitForTimeout(2300);
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight*0.5){scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}});
  await p.waitForTimeout(400);
  const d = await p.evaluate(()=>{
    // the About portrait is XqTvKhL5G8Ej... — find it, report display/visibility/size
    const port = [...document.querySelectorAll('img')].find(im=>/XqTvKhL5G8Ej/.test(im.currentSrc||im.src));
    const portInfo = port ? (()=>{ let n=port,disp='shown'; for(let i=0;i<6&&n;i++){ const cs=getComputedStyle(n); if(cs.display==='none'){disp='display:none';break;} if(cs.visibility==='hidden'){disp='hidden';break;} n=n.parentElement;} const r=port.getBoundingClientRect(); return { disp, w:Math.round(r.width), h:Math.round(r.height) }; })() : 'NOT IN DOM';
    // bio: the paragraph containing "delight driven"
    let bio=null,bs=0; for(const el of document.querySelectorAll('p,div')){ const t=(el.textContent||'').replace(/\s+/g,' '); if(/delight driven/.test(t) && t.length<400){ const fs=parseFloat(getComputedStyle(el).fontSize)||0; if(fs>bs){bs=fs;bio=el;} } }
    const bioInfo = bio? (()=>{ const cs=getComputedStyle(bio); const r=bio.getBoundingClientRect(); return { fs:cs.fontSize, w:cs.fontWeight, bw:Math.round(r.width), x:Math.round(r.left) }; })():null;
    return { portrait:portInfo, bio:bioInfo };
  });
  console.log(`W${W}: portrait=${JSON.stringify(d.portrait)}  bio=${JSON.stringify(d.bio)}`);
  await p.close();
}
await b.close();
