import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'no-preference' })).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,80)));
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(1000);
// scroll to card 2 (gamify)
const c2 = await p.evaluate(()=>[...document.querySelectorAll('.rw-card')][1].getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
await p.evaluate((y)=>{const t=y-20;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, c2); await p.waitForTimeout(1500);
const vids = await p.evaluate(async ()=>{
  const out=[];
  for (const v of document.querySelectorAll('video')){
    const t0=v.currentTime; await new Promise(r=>setTimeout(r,500)); const t1=v.currentTime;
    const src = v.currentSrc.split('/').pop();
    out.push({ src, paused:v.paused, muted:v.muted, loop:v.loop, playsInline:v.playsInline, readyState:v.readyState, vw:v.videoWidth, vh:v.videoHeight, advancing: t1>t0, t0:+t0.toFixed(2), t1:+t1.toFixed(2) });
  }
  return out;
});
console.log('videos on gamify view:', JSON.stringify(vids,null,1));
await p.screenshot({ path:'audit/out/diff/gif_card2.png', clip:{x:120,y:60,width:640,height:640} });
// card 4 collage
const c4 = await p.evaluate(()=>[...document.querySelectorAll('.rw-card')][3].getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
await p.evaluate((y)=>{const t=y-20;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, c4); await p.waitForTimeout(1200);
await p.screenshot({ path:'audit/out/diff/gif_card4.png', clip:{x:120,y:60,width:640,height:640} });
console.log('errors', errs.length, errs);
await b.close();
