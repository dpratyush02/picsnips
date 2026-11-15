export interface MediaInfo { width:number; height:number; duration:number; name:string; bytes:number; kind:'video'|'gif'|'sequence'; frames?:number }
export interface Capture { bitmap:ImageBitmap; time:number; verified:boolean }
export interface LocalMedia { info:MediaInfo; url:string; capture(time:number,width:number,height:number,signal:AbortSignal):Promise<Capture>; close():void }
export function checkAbort(signal:AbortSignal){if(signal.aborted)throw new DOMException('Cancelled','AbortError');}
function event(target:HTMLVideoElement,name:string,signal:AbortSignal,action?:()=>void){return new Promise<void>((resolve,reject)=>{
  const clean=()=>{clearTimeout(timer);target.removeEventListener(name,done);target.removeEventListener('error',fail);signal.removeEventListener('abort',abort);};
  const done=()=>{clean();resolve();},fail=()=>{clean();reject(new Error('This video cannot be decoded. Try an H.264 MP4 or another compatible browser.'));},abort=()=>{clean();reject(new DOMException('Cancelled','AbortError'));};
  const timer=setTimeout(()=>{clean();reject(new Error('Video decoding timed out. Try a shorter clip or another browser.'));},15000);
  target.addEventListener(name,done,{once:true});target.addEventListener('error',fail,{once:true});signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}action?.();
});}
function validate(info:MediaInfo){if(!Number.isFinite(info.duration)||info.duration<=0||info.duration>300)throw new Error('Choose a finite video or GIF up to 5 minutes long.');if(!info.width||!info.height||info.width*info.height>16_600_000)throw new Error('Use media up to 16.6 megapixels per frame.');}
export async function openMedia(files:File[],signal:AbortSignal):Promise<LocalMedia>{
  checkAbort(signal);if(!files.length)throw new Error('Choose a file.');
  if(files.length>1||/^image\/(png|jpeg|webp)$/.test(files[0].type))return openSequence(files,signal);
  const file=files[0],gif=file.type==='image/gif'||/\.gif$/i.test(file.name);
  if(file.size>(gif?25:150)*1024*1024)throw new Error(gif?'GIF limit: 25 MB.':'Video limit: 150 MB. Trim or compress your file locally first.');
  if(gif)return openGif(file,signal);
  if(!/\.(mp4|webm|mov|m4v)$/i.test(file.name)&&!/^video\//.test(file.type))throw new Error('Choose MP4, WebM, compatible MOV, GIF, or PNG/JPEG/WebP images.');
  const url=URL.createObjectURL(file),video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';
  // A tiny rendered element lets compositor frame callbacks fire without playing audio.
  video.style.cssText='position:fixed;left:0;bottom:0;width:1px;height:1px;pointer-events:none;opacity:.001';video.setAttribute('aria-hidden','true');document.body.append(video);
  const close=()=>{video.pause();video.removeAttribute('src');video.load();video.remove();URL.revokeObjectURL(url);};
  try{
    await event(video,'loadeddata',signal,()=>{video.src=url;video.load();});
    const info:MediaInfo={kind:'video',width:video.videoWidth,height:video.videoHeight,duration:video.duration,name:file.name,bytes:file.size};validate(info);
    return {info,url,close,async capture(time,width,height,signal){
      checkAbort(signal);video.pause();let frameTime=time,verified=false;
      if(Math.abs(video.currentTime-time)>.00001){
        let callback:number|undefined;let reported:number|undefined;
        if(video.requestVideoFrameCallback)callback=video.requestVideoFrameCallback((_,metadata)=>{reported=metadata.mediaTime;});
        try{await event(video,'seeked',signal,()=>{video.currentTime=time;});
          // seeked guarantees decoding; compositor callbacks improve timestamp reporting.
          await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
          if(video.seeking||video.readyState<2||Math.abs(video.currentTime-time)>.05)throw new Error('The browser did not finish seeking to the requested frame.');
          if(reported!==undefined){frameTime=reported;verified=true;}
        }finally{if(callback!==undefined)video.cancelVideoFrameCallback(callback);}
      }
      checkAbort(signal);
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d')!.drawImage(video,0,0,width,height);
      const bitmap=await createImageBitmap(canvas);canvas.width=canvas.height=0;return {bitmap,time:frameTime,verified};
    }};
  }catch(e){close();throw e;}
}
async function openGif(file:File,signal:AbortSignal):Promise<LocalMedia>{
  const worker=new Worker(new URL('../../workers/gif.worker.ts',import.meta.url));let id=0;
  const pending=new Map<number,{resolve:(v:unknown)=>void;reject:(e:Error)=>void}>();
  const fail=(error:Error)=>{pending.forEach(p=>p.reject(error));pending.clear();};
  worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p){data.result?.bitmap?.close();return;}pending.delete(data.id);if(data.error)p.reject(new Error(data.error));else p.resolve(data.result);};
  worker.onerror=()=>fail(new Error('GIF decoding is unavailable in this browser. Try a current desktop browser or an image sequence.'));
  const request=<T>(type:string,args:object,signal:AbortSignal,transfer:Transferable[]=[]):Promise<T>=>new Promise((resolve,reject)=>{
    const key=++id;const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);};
    const abort=()=>{pending.delete(key);cleanup();reject(new DOMException('Cancelled','AbortError'));};
    const timer=setTimeout(()=>{pending.delete(key);cleanup();reject(new Error('GIF decoding timed out. Use a shorter or smaller GIF.'));},20000);
    pending.set(key,{resolve:v=>{cleanup();resolve(v as T);},reject:e=>{cleanup();reject(e);}});signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}worker.postMessage({id:key,type,...args},transfer);
  });
  const url=URL.createObjectURL(file);const close=()=>{worker.terminate();fail(new Error('Decoder closed.'));URL.revokeObjectURL(url);};
  try{const bytes=await file.arrayBuffer();checkAbort(signal);const result=await request<{width:number;height:number;duration:number;frames:number}>('open',{bytes},signal,[bytes]);const info:MediaInfo={...result,kind:'gif',name:file.name,bytes:file.size};validate(info);
    return {info,url,close,async capture(time,width,height,signal){const frame=await request<{bitmap:ImageBitmap;time:number}>('capture',{time,width,height},signal);return {...frame,verified:true};}};
  }catch(e){close();throw e;}
}
async function openSequence(files:File[],signal:AbortSignal):Promise<LocalMedia>{
  if(files.length<2||files.length>20)throw new Error('Choose 2–20 PNG, JPEG or WebP images for a sequence.');
  const ordered=[...files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));const images:HTMLImageElement[]=[];const urls:string[]=[];let pixels=0;
  const close=()=>urls.forEach(url=>URL.revokeObjectURL(url));
  try{for(const file of ordered){checkAbort(signal);if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>20*1024*1024)throw new Error('Sequence images must be PNG, JPEG or WebP, under 20 MB each.');const url=URL.createObjectURL(file);urls.push(url);const img=new Image();img.src=url;await img.decode();checkAbort(signal);pixels+=img.naturalWidth*img.naturalHeight;if(pixels>40_000_000)throw new Error('Sequence exceeds 40 megapixels total. Use smaller images.');images.push(img);}
    const info:MediaInfo={width:images[0].naturalWidth,height:images[0].naturalHeight,duration:images.length,name:`${images.length} images (filename order)`,bytes:files.reduce((n,f)=>n+f.size,0),kind:'sequence',frames:images.length};validate(info);
    return {info,url:urls[0],close,async capture(time,width,height,signal){checkAbort(signal);const index=Math.min(images.length-1,Math.floor(time)),img=images[index];const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;const ratio=Math.min(width/img.naturalWidth,height/img.naturalHeight);ctx.drawImage(img,(width-img.naturalWidth*ratio)/2,(height-img.naturalHeight*ratio)/2,img.naturalWidth*ratio,img.naturalHeight*ratio);const bitmap=await createImageBitmap(canvas);canvas.width=canvas.height=0;return {bitmap,time:index,verified:true};}};
  }catch(e){close();throw e;}
}
