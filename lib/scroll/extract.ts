import { chooseMoments, outputSize, timestamps, type ExtractionMode } from './plan';
import { checkAbort, type LocalMedia } from './media';
export interface Frame { id:string; blob:Blob; url:string; requested:number; actual:number; verified:boolean; width:number; height:number }
export interface Extraction {start:number;end:number;count:number;mode:ExtractionMode;custom:number[];resolution:string}
export async function extractFrames(source:LocalMedia,settings:Extraction,signal:AbortSignal,progress:(value:number,label:string)=>void):Promise<Frame[]>{
  const {start,end,count,mode,custom,resolution}=settings;
  if(end>source.info.duration||end<=start)throw new Error('Choose an end time after the start, within the source duration.');
  let times=mode==='custom'?[...new Set(custom)].sort((a,b)=>a-b):timestamps(start,end,mode==='before-after'?2:count);
  if(times.length<2||times.length>20||times.some(t=>!Number.isFinite(t)||t<start||t>=end))throw new Error('Choose 2–20 different timestamps within the selected range (before the end).');
  const size=outputSize(source.info.width,source.info.height,resolution),results:Frame[]=[];
  try{
    if(mode==='moments'){
      const candidates=Array.from({length:Math.min(100,count*4)},(_,i)=>start+(end-start-.001)*i/(Math.min(100,count*4)-1));const scores:number[]=[];let previous:Uint8ClampedArray|undefined;
      const small=document.createElement('canvas');small.width=64;small.height=36;const ctx=small.getContext('2d',{willReadFrequently:true})!;
      for(let i=0;i<candidates.length;i++){checkAbort(signal);const frame=await source.capture(candidates[i],64,36,signal);try{ctx.clearRect(0,0,64,36);ctx.drawImage(frame.bitmap,0,0);const data=ctx.getImageData(0,0,64,36).data;let delta=0;if(previous)for(let p=0;p<data.length;p+=4)delta+=Math.abs(data[p]-previous[p])+Math.abs(data[p+1]-previous[p+1])+Math.abs(data[p+2]-previous[p+2]);scores.push(delta);previous=data;}finally{frame.bitmap.close();}progress((i+1)/candidates.length*40,`Analyzing motion ${i+1}/${candidates.length}`);}
      small.width=small.height=0;times=chooseMoments(candidates,scores,count);
    }
    const canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;const ctx=canvas.getContext('2d')!;let bytes=0;
    try{for(let i=0;i<times.length;i++){checkAbort(signal);const capture=await source.capture(times[i],size.width,size.height,signal);try{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(capture.bitmap,0,0);}finally{capture.bitmap.close();}
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image encoding failed. Choose a smaller resolution.')),'image/png'));
      checkAbort(signal);bytes+=blob.size;if(bytes>120*1024*1024)throw new Error('Frames exceed the 120 MB memory budget. Choose a smaller resolution.');
      results.push({id:crypto.randomUUID(),blob,url:URL.createObjectURL(blob),requested:times[i],actual:capture.time,verified:capture.verified,...size});
      progress((mode==='moments'?40:0)+(i+1)/times.length*(mode==='moments'?60:100),`Extracting frame ${i+1}/${times.length}`);await new Promise(resolve=>setTimeout(resolve,0));
    }}finally{canvas.width=canvas.height=0;}
    return results;
  }catch(e){results.forEach(f=>URL.revokeObjectURL(f.url));throw e;}
}
export async function exportFrame(frame:Frame,index:number,count:number,format:string,overlay:boolean):Promise<Blob>{
  if(format==='image/png'&&!overlay)return frame.blob;
  const bitmap=await createImageBitmap(frame.blob),canvas=document.createElement('canvas');canvas.width=frame.width;canvas.height=frame.height;const ctx=canvas.getContext('2d')!;
  try{if(format==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(bitmap,0,0);if(overlay){const font=Math.max(12,Math.round(canvas.width*.025));const pad=font*.5;ctx.font=`600 ${font}px sans-serif`;const text=`${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`,w=ctx.measureText(text).width;ctx.fillStyle='#000000a6';ctx.fillRect(canvas.width-w-pad*3,canvas.height-font-pad*3,w+pad*2,font+pad*2);ctx.fillStyle='#fff';ctx.textBaseline='top';ctx.fillText(text,canvas.width-w-pad*2,canvas.height-font-pad*2);}
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not encode image.')),format,.94));if(blob.type!==format)throw new Error('This browser does not support the selected export format. Choose PNG or JPG.');return blob;
  }finally{bitmap.close();canvas.width=canvas.height=0;}
}
