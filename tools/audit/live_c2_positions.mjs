import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 2600 }, reducedMotion: 'no-preference' })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load' }).catch(()=>{});
await p.waitForTimeout(2500);
await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));} scrollTo(0,0); });
await p.waitForTimeout(500);
await p.evaluate(() => { for (const el of document.querySelectorAll('*')) { if (getComputedStyle(el).position==='sticky') el.style.position='relative'; } });
await p.waitForTimeout(300);
const d = await p.evaluate(() => {
  const gifs=[...document.querySelectorAll('img')].filter(im=>/\.gif/i.test(im.currentSrc||im.src)).map(im=>({im,r:im.getBoundingClientRect(),src:(im.currentSrc||im.src).split('/').pop().slice(0,12)}));
  const big=gifs.filter(g=>Math.abs(g.r.width-253)<8 && g.r.height>500)[0];
  const small=gifs.filter(g=>Math.abs(g.r.width-200)<12 && g.r.height>380 && g.r.height<500)[0];
  if(!big) return {none:true};
  let node=big.im, media=null;
  for(let k=0;k<10&&node;k++){const r=node.getBoundingClientRect(); if(r.width>=490&&r.width<=560&&r.height>=490&&r.height<=560){media=node;break;} node=node.parentElement;}
  const mr=media.getBoundingClientRect();
  const rel=(g)=>g?({ w:Math.round(g.r.width), h:Math.round(g.r.height), left:Math.round(g.r.left-mr.left), top:Math.round(g.r.top-mr.top), right:Math.round(g.r.right-mr.left), bottom:Math.round(g.r.bottom-mr.top), cx:Math.round(g.r.left+g.r.width/2-mr.left) }):null;
  // transform of each phone wrapper (to read origin/rotation at rest)
  const wrapTf=(g)=>{ let n=g.im; for(let k=0;k<4;k++){const cs=getComputedStyle(n); if(cs.transform&&cs.transform!=='none') return {tf:cs.transform, origin:cs.transformOrigin}; n=n.parentElement;} return null; };
  return { media:{w:Math.round(mr.width),h:Math.round(mr.height)}, big:rel(big), small:rel(small), bigTf:wrapTf(big), smallTf:wrapTf(small) };
});
console.log(JSON.stringify(d,null,1));
await b.close();
