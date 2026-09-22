import { chromium } from 'playwright';
import sharp from 'sharp';
const b = await chromium.launch({ headless: true });
// capture my desktop footer pinned (match live frame's vertical position)
const p = await (await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'no-preference' })).newPage();
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const fy = await p.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
// scroll deep into the pin so the CTA is centered
await p.evaluate((v)=>{window.scrollTo(0,v);document.documentElement.scrollTop=v;document.body.scrollTop=v;}, fy+700);
await p.waitForTimeout(700);
await p.screenshot({ path:'audit/out/footer/mine_pin.png' });
await p.close();
await b.close();
// side by side: live frame_1440_00 (left) vs mine_pin (right)
const live = await sharp('audit/out/footer/frame_1440_00_y14519.png').resize({width:720}).toBuffer();
const mine = await sharp('audit/out/footer/mine_pin.png').resize({width:720}).toBuffer();
const lm = await sharp(live).metadata(); const mm = await sharp(mine).metadata();
const H = Math.max(lm.height, mm.height);
const lab=(t)=>Buffer.from(`<svg width="720" height="28"><rect width="720" height="28" fill="#111"/><text x="8" y="20" font-family="Arial" font-size="16" fill="#fff">${t}</text></svg>`);
await sharp({create:{width:1440,height:H+28,channels:3,background:'#000'}})
 .composite([{input:lab('LIVE'),top:0,left:0},{input:live,top:28,left:0},{input:lab('MINE'),top:0,left:720},{input:mine,top:28,left:720}])
 .png().toFile('audit/out/footer/sbs_1440.png');
console.log('saved sbs_1440.png');
