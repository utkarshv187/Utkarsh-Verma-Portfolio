import sharp from 'sharp';
const src = 'audit/out/hob/live2/scan_2_y7984.png';
const meta = await sharp(src).metadata();
console.log('img', meta.width, 'x', meta.height);
// three stacks at 1440: gaming cx~289, soc cx~740, adv cx~1151, top band 60..350
const crops = [
  { name: 'gaming', x: 40, y: 40, w: 500, h: 340 },
  { name: 'soc', x: 500, y: 40, w: 480, h: 300 },
  { name: 'adv', x: 920, y: 40, w: 500, h: 340 },
];
for (const c of crops) { await sharp(src).extract({ left: c.x, top: c.y, width: c.w, height: c.h }).resize({ width: 720 }).toFile(`audit/out/hob/live2/crop_${c.name}.png`); console.log('wrote crop_' + c.name); }
