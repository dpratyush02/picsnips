import { parseGif, GifCompositor } from '../lib/scroll/gif';
let compositor:GifCompositor|undefined;
let canvas:OffscreenCanvas|undefined;
self.onmessage=({data}:{data:{id:number;type:string;bytes?:ArrayBuffer;time?:number;width?:number;height?:number}})=>{
  try{
    if(data.type==='open'){
      compositor=new GifCompositor(parseGif(new Uint8Array(data.bytes!)));const {width,height,duration,frames}=compositor.gif;
      canvas=new OffscreenCanvas(width,height);self.postMessage({id:data.id,result:{width,height,duration,frames:frames.length}});
    }else{
      if(!compositor||!canvas)throw new Error('GIF decoder is not ready.');
      const frame=compositor.render(data.time!);canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(frame.pixels),canvas.width,canvas.height),0,0);
      const output=new OffscreenCanvas(data.width!,data.height!);const ctx=output.getContext('2d')!;ctx.drawImage(canvas,0,0,output.width,output.height);const bitmap=output.transferToImageBitmap();self.postMessage({id:data.id,result:{bitmap,time:frame.time}},[bitmap]);
    }
  }catch(e){self.postMessage({id:data.id,error:e instanceof Error?e.message:'GIF decoding failed.'});}
};
