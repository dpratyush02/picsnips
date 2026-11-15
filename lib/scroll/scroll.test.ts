import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { timestamps, chooseMoments, pingPong, frameName, outputSize } from './plan.ts';
import { parseGif, GifCompositor } from './gif.ts';
test('20 evenly spaced timestamps include start and stay before end',()=>{const times=timestamps(1,6,20);assert.equal(times.length,20);assert.equal(times[0],1);assert.ok(times[19]<6);for(let i=1;i<20;i++)assert.ok(times[i]>times[i-1]);assert.throws(()=>timestamps(6,1,20));});
test('key moments keep endpoints and chronological order',()=>{const result=chooseMoments([0,1,2,3,4,5],[0,1,90,1,80,0],4);assert.deepEqual(result,[0,2,4,5]);});
test('ping pong includes both ends and never exceeds 20 frames',()=>{for(let n=2;n<=20;n++){const frames=Array.from({length:n},(_,i)=>i),out=pingPong(frames);assert.ok(out.length<=20);assert.equal(out[0],0);assert.ok(out.includes(n-1));assert.ok(out.every(i=>i>=0&&i<n));}});
test('export filenames and size limits',()=>{assert.equal(frameName(0,'image/png'),'frame_01.png');assert.equal(frameName(19,'image/jpeg'),'frame_20.jpg');assert.deepEqual(outputSize(1920,1080,'1280'),{width:1280,height:720});assert.deepEqual(outputSize(640,480,'1920'),{width:640,height:480});assert.throws(()=>outputSize(8000,8000,'original'));});
test('animated GIF decodes distinct frames, exact delays and reverse seeks',()=>{const gif=parseGif(new Uint8Array(readFileSync(new URL('../../public/examples/scroll-sample.gif',import.meta.url))));assert.equal(gif.frames.length,12);assert.ok(Math.abs(gif.duration-1.2)<.00001);const player=new GifCompositor(gif);const first=player.render(0).pixels.slice();const last=player.render(1.15).pixels.slice();assert.notDeepEqual(first,last);assert.deepEqual(player.render(0).pixels,first);assert.equal(first[(50*192+20)*4],251);assert.equal(last[(50*192+20)*4],24);});
test('invalid GIF headers and truncated data fail cleanly',()=>{assert.throws(()=>parseGif(new Uint8Array([1,2,3])));assert.throws(()=>parseGif(new Uint8Array(100)));});

test('GIF disposal modes and LZW dictionary growth match reference pixels',async()=>{
  const {createHash}=await import('node:crypto');
  const expected=JSON.parse(readFileSync(new URL('./fixtures/expected.json',import.meta.url),'utf8')) as Record<string,string[]>;
  for(const [file,hashes] of Object.entries(expected)){
    const gif=parseGif(new Uint8Array(readFileSync(new URL(`./fixtures/${file}`,import.meta.url)))),player=new GifCompositor(gif);
    hashes.forEach((hash,i)=>{const pixels=player.render(gif.frames[i].start+.001).pixels.slice();for(let p=0;p<pixels.length;p+=4)if(!pixels[p+3])pixels.fill(0,p,p+3);assert.equal(createHash('sha256').update(pixels).digest('hex'),hash,`${file} frame ${i}`);});
  }
});
