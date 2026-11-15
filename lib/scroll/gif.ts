// GIF87a/89a parsing, LZW decoding and disposal-aware compositing. No network dependencies.
export interface GifFrame { left:number; top:number; width:number; height:number; delay:number; start:number; disposal:number; transparent:number; interlaced:boolean; palette:Uint8Array; minCodeSize:number; data:Uint8Array }
export interface Gif { width:number; height:number; duration:number; background:number[]; frames:GifFrame[] }
export function parseGif(bytes:Uint8Array):Gif {
  let pos=0;
  function take(n:number){if(pos+n>bytes.length)throw new Error('The GIF is truncated.');const v=bytes.subarray(pos,pos+n);pos+=n;return v;}
  const byte=()=>take(1)[0]; const word=()=>{const b=take(2);return b[0]+b[1]*256;};
  function blocks(){const parts:Uint8Array[]=[];let size=0;for(let n=byte();n;n=byte()){parts.push(take(n));size+=n;}const result=new Uint8Array(size);let at=0;for(const part of parts){result.set(part,at);at+=part.length;}return result;}
  const signature=String.fromCharCode(...take(6));if(signature!=='GIF89a'&&signature!=='GIF87a')throw new Error('Not a valid GIF.');
  const width=word(),height=word(),packed=byte(),backgroundIndex=byte();byte();
  if(!width||!height||width*height>8_300_000)throw new Error('GIF dimensions exceed the 8.3 MP limit.');
  const globalPalette=packed&128?take(3*(1<<((packed&7)+1))):new Uint8Array();
  let disposal=0,transparent=-1,delay=.1,duration=0;
  const frames:GifFrame[]=[];
  while(pos<bytes.length){const marker=byte();if(marker===0x3b)break;
    if(marker===0x21){const type=byte();if(type===0xf9){if(byte()!==4)throw new Error('Invalid GIF control block.');const flags=byte(),ticks=word(),index=byte();if(byte()!==0)throw new Error('Invalid GIF block terminator.');disposal=(flags>>2)&7;transparent=flags&1?index:-1;delay=ticks===0?.1:Math.max(.02,ticks/100);}else blocks();continue;}
    if(marker!==0x2c)throw new Error('Unsupported or damaged GIF block.');
    const left=word(),top=word(),fw=word(),fh=word(),flags=byte();
    if(!fw||!fh||left+fw>width||top+fh>height)throw new Error('Invalid GIF frame bounds.');
    const palette=flags&128?take(3*(1<<((flags&7)+1))):globalPalette;
    if(!palette.length)throw new Error('GIF has no color palette.');
    const minCodeSize=byte();if(minCodeSize<2||minCodeSize>8)throw new Error('Invalid GIF code size.');
    frames.push({left,top,width:fw,height:fh,delay,start:duration,disposal,transparent,interlaced:!!(flags&64),palette,minCodeSize,data:blocks()});duration+=delay;
    if(frames.length>1500||duration>300)throw new Error('Use a GIF under 1500 frames and 5 minutes.');
    disposal=0;transparent=-1;delay=.1;
  }
  if(!frames.length)throw new Error('The GIF contains no image frames.');
  const offset=backgroundIndex*3;
  const background=frames.some(f=>f.transparent>=0)||offset+2>=globalPalette.length?[0,0,0,0]:[...globalPalette.subarray(offset,offset+3),255];
  return {width,height,duration,background,frames};
}
export function decodeIndices(frame:GifFrame):Uint8Array {
  const clear=1<<frame.minCodeSize,end=clear+1,output=new Uint8Array(frame.width*frame.height);
  const prefix=new Uint16Array(4096),suffix=new Uint8Array(4096),stack=new Uint8Array(4097);
  for(let i=0;i<clear;i++)suffix[i]=i;
  let bits=frame.minCodeSize+1,next=end+1,old=-1,first=0,bit=0,out=0;
  while(bit+bits<=frame.data.length*8){let code=0;for(let n=0;n<bits;n++,bit++)code|=((frame.data[bit>>3]>>(bit&7))&1)<<n;
    if(code===clear){bits=frame.minCodeSize+1;next=end+1;old=-1;continue;}if(code===end)break;
    const original=code;let depth=0;
    if(code>=next){if(code!==next||old<0)throw new Error('Invalid GIF LZW stream.');stack[depth++]=first;code=old;}
    while(code>=clear){if(code>=next||depth>=4096)throw new Error('Invalid GIF dictionary.');stack[depth++]=suffix[code];code=prefix[code];}
    first=suffix[code];stack[depth++]=first;
    while(depth){if(out>=output.length)throw new Error('GIF frame exceeds its bounds.');output[out++]=stack[--depth];}
    if(old>=0&&next<4096){prefix[next]=old;suffix[next]=first;next++;if(next===(1<<bits)&&bits<12)bits++;}old=original;
  }
  if(out!==output.length)throw new Error('Incomplete GIF frame.');return output;
}
export class GifCompositor {
  readonly pixels:Uint8ClampedArray;private current=-1;private previous:Uint8ClampedArray|null=null;
  readonly gif:Gif;
  constructor(gif:Gif){this.gif=gif;this.pixels=new Uint8ClampedArray(gif.width*gif.height*4);this.reset();}
  private clear(left:number,top:number,width:number,height:number){for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)this.pixels.set(this.gif.background,(y*this.gif.width+x)*4);}
  private reset(){this.clear(0,0,this.gif.width,this.gif.height);this.current=-1;this.previous=null;}
  render(time:number){let target=this.gif.frames.findIndex(f=>time<f.start+f.delay);if(target<0)target=this.gif.frames.length-1;if(target<this.current)this.reset();
    while(this.current<target){const prior=this.gif.frames[this.current];if(prior?.disposal===2)this.clear(prior.left,prior.top,prior.width,prior.height);else if(prior?.disposal===3&&this.previous)this.pixels.set(this.previous);
      const frame=this.gif.frames[++this.current];this.previous=frame.disposal===3?this.pixels.slice():null;
      const indices=decodeIndices(frame),rows:number[]=[];
      if(frame.interlaced){for(const [start,step] of [[0,8],[4,8],[2,4],[1,2]])for(let y=start;y<frame.height;y+=step)rows.push(y);}else for(let y=0;y<frame.height;y++)rows.push(y);
      let i=0;for(const row of rows)for(let col=0;col<frame.width;col++){const color=indices[i++];if(color===frame.transparent)continue;const p=color*3;if(p+2>=frame.palette.length)throw new Error('Invalid GIF palette index.');const at=((frame.top+row)*this.gif.width+frame.left+col)*4;this.pixels[at]=frame.palette[p];this.pixels[at+1]=frame.palette[p+1];this.pixels[at+2]=frame.palette[p+2];this.pixels[at+3]=255;}
    }
    return {pixels:this.pixels,time:this.gif.frames[target].start};
  }
}
