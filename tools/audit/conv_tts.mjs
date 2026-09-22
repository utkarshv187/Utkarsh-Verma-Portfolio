import sharp from 'sharp';
const dir='../public/images/';
for(const n of [1,2,3]){
  const src=`${dir}tts-${n}-m.jpg`;
  await sharp(src).webp({quality:82}).toFile(`${dir}tts-${n}-m.webp`);
  await sharp(src).avif({quality:58}).toFile(`${dir}tts-${n}-m.avif`);
  const meta=await sharp(src).metadata();
  console.log(`tts-${n}-m: ${meta.width}x${meta.height}`);
}
console.log('done');
