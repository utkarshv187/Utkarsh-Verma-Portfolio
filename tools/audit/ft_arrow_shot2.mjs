import { chromium } from 'playwright';
import sharp from 'sharp';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2 })).newPage();
await p.goto('http://localhost:5199/',{waitUntil:'load'}).catch(()=>{});
await p.waitForTimeout(900);
const fy = await p.evaluate(()=>document.querySelector('.footer').getBoundingClientRect().top+(window.scrollY||document.body.scrollTop));
await p.evaluate((y)=>{const t=y+700;window.scrollTo(0,t);document.documentElement.scrollTop=t;document.body.scrollTop=t;}, fy); await p.waitForTimeout(700);
await p.locator('.footer__pill--mail').hover(); await p.waitForTimeout(450);
await p.screenshot({ path:'audit/out/footer/mine_full_hover.png' });
// crop the pills band (deviceScaleFactor 2 -> full image is 2880 wide, pills near bottom)
const meta = await sharp('audit/out/footer/mine_full_hover.png').metadata();
console.log('img', meta.width, meta.height);
// pills are around y700 (css) -> *2 = 1400; crop y 1360..1520, x 200..1800
await sharp('audit/out/footer/mine_full_hover.png').extract({left:200,top:1360,width:1700,height:200}).toFile('audit/out/footer/mine_pill_hover.png');
console.log('cropped');
await b.close();
