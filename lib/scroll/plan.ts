export type ExtractionMode = 'smooth' | 'moments' | 'custom' | 'before-after';
export function timestamps(start: number, end: number, count: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || !Number.isInteger(count) || count < 2 || count > 20) throw new Error('Choose a valid range and 2–20 frames.');
  const last = Math.max(start, end - Math.min(.001, (end - start) / 100));
  return Array.from({length:count},(_,i)=>start+(last-start)*i/(count-1));
}
export function outputSize(width:number,height:number,preset:string) {
  const ratio=preset==='original'?1:Math.min(1,Number(preset)/Math.max(width,height));
  const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
  if(w*h>8_300_000)throw new Error('Original resolution exceeds the 8.3 MP export limit. Choose 1920px or 1280px.');
  return {width:w,height:h};
}
export function chooseMoments(times:number[],scores:number[],count:number) {
  // Include both ends, then strongest changes with a small temporal separation.
  const selected=new Set([0,times.length-1]);
  const ranked=times.map((_,i)=>i).slice(1,-1).sort((a,b)=>scores[b]-scores[a]||a-b);
  const spacing=Math.max(1,Math.floor(times.length/count/2));
  for(const i of ranked){if(selected.size===count)break;if([...selected].every(j=>Math.abs(i-j)>=spacing))selected.add(i);}
  for(const i of ranked){if(selected.size===count)break;selected.add(i);}
  return [...selected].sort((a,b)=>a-b).map(i=>times[i]);
}
export function pingPong<T>(items:T[]) { if(items.length<2)return items;const forward=items.length<=11?items:Array.from({length:11},(_,i)=>items[Math.round(i*(items.length-1)/10)]);return [...forward,...forward.slice(1,-1).reverse()].slice(0,20); }
export function frameName(index:number,format:string) { return `frame_${String(index+1).padStart(2,'0')}.${format==='image/jpeg'?'jpg':format==='image/webp'?'webp':'png'}`; }
