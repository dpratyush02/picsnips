import { ASSETS, type RuntimeManifest } from './runtime';
import { SAMPLE_RATE } from './dsp';
export const MAX_SECONDS = 120;
export const MAX_BYTES = 40 * 1024 * 1024;
type FFmpeg = {
  load(options: { coreURL: string; wasmURL: string; classWorkerURL: string }): Promise<boolean>;
  writeFile(name: string, bytes: Uint8Array): Promise<void>;
  readFile(name: string): Promise<Uint8Array | string>;
  exec(args: string[], timeout?: number): Promise<number>;
  ffprobe(args: string[], timeout?: number): Promise<number>;
  on(type: 'progress', cb: (event: {progress: number}) => void): void;
  terminate(): void;
};
export function cancelled(signal: AbortSignal) { if (signal.aborted) throw new DOMException('Processing cancelled.', 'AbortError'); }
export function isVideo(file: File) { return file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name) && !file.type.startsWith('audio/'); }
export function validateFile(file: Pick<File, 'name' | 'size'>) {
  if (!/\.(mp3|wav|m4a|ogg|webm|mp4|mov)$/i.test(file.name)) throw new Error('Choose MP3, WAV, M4A, OGG, WebM, MP4 or MOV. Codec support varies.');
  if (!file.size || file.size > MAX_BYTES) throw new Error('Choose a recording under 40 MB. Short clips up to 2 minutes are supported to limit memory use.');
}
async function withFFmpeg<T>(manifest: RuntimeManifest, signal: AbortSignal, progress: (value: number) => void, work: (engine: FFmpeg) => Promise<T>) {
  if (!manifest.ffmpeg) throw new Error('Video and MP3 export are unavailable without the local media runtime. Try a browser-decodable audio file and WAV export.');
  const url = `${ASSETS}/ffmpeg/index.js`;
  const runtime = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
  cancelled(signal);
  const engine = new runtime.FFmpeg() as FFmpeg;
  const stop = () => engine.terminate();
  signal.addEventListener('abort', stop, { once: true });
  const timer = setTimeout(stop, 180000);
  try {
    engine.on('progress', e => progress(Math.max(0, Math.min(1, e.progress))));
    await engine.load({ coreURL: `${location.origin}${ASSETS}/core/ffmpeg-core.js`, wasmURL: `${location.origin}${ASSETS}/core/ffmpeg-core.wasm`, classWorkerURL: `${location.origin}${ASSETS}/ffmpeg/worker.js` });
    cancelled(signal); return await work(engine);
  } finally { clearTimeout(timer); signal.removeEventListener('abort', stop); engine.terminate(); }
}
async function bytes(engine: FFmpeg, path: string) { const data = await engine.readFile(path); if (typeof data === 'string') throw new Error('Invalid media output.'); return data; }
const inputOptions = ['-protocol_whitelist', 'file', '-format_whitelist', 'mov,matroska,webm,mp3,wav,ogg,m4a,mp4'];
type ProbeInfo = {
  streams: {codec_type: string; start_time?: string; duration?: string; disposition?: {attached_pic?: number}}[];
  format: {duration?: string};
  error?: unknown;
};
async function probe(engine: FFmpeg, input: string) {
  const unreadable = 'Could not read the recording metadata. Try reopening the source file or exporting a fresh copy.';
  const output = 'probe.json';
  const status = await engine.ffprobe([
    '-v', 'error', ...inputOptions, '-show_error', '-show_streams', '-show_format',
    '-of', 'json', input, '-o', output,
  ], 30000);

  // The pinned WASM core can leave its exit status at -1 even after writing
  // complete metadata. Require a valid report with no structured probe error.
  if (status !== 0 && status !== -1) throw new Error(unreadable);
  try {
    const raw = await engine.readFile(output);
    const info = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)) as ProbeInfo;
    if (info && !info.error && Array.isArray(info.streams) && info.format && typeof info.format === 'object') return info;
  } catch {
    // Missing or incomplete output is also possible after a failed probe.
  }
  throw new Error(unreadable);
}
export async function extractAudio(file: File, manifest: RuntimeManifest, signal: AbortSignal, progress: (n: number) => void) {
  return withFFmpeg(manifest, signal, progress, async engine => {
    const name = `source.${file.name.split('.').pop()!.toLowerCase()}`;
    await engine.writeFile(name, new Uint8Array(await file.arrayBuffer())); cancelled(signal);
    const info = await probe(engine, name), audio = info.streams.find(s => s.codec_type === 'audio'), video = info.streams.find(s => s.codec_type === 'video' && !s.disposition?.attached_pic);
    if (!audio) throw new Error('This recording has no audio track to enhance.');
    const duration = Number(info.format.duration ?? audio.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_SECONDS) throw new Error('Use a finite recording up to 2 minutes long.');
    // Fail rather than silently shifting speech for edited files with offset tracks.
    if (Math.abs(Number(audio.start_time ?? 0)) > .02 || (video && Math.abs(Number(video.start_time ?? 0)) > .02)) throw new Error('This recording has offset media tracks. Export a zero-start version in your editor first to preserve synchronization.');
    if (await engine.exec([...inputOptions, '-i', name, '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '48000', '-t', '120', '-c:a', 'pcm_f32le', '-f', 'f32le', 'audio.f32'], 120000)) throw new Error('Audio decoding failed. Try WAV or another supported codec.');
    const data = await bytes(engine, 'audio.f32');
    if (!data.length || data.length % 4) throw new Error('No decodable audio samples found.');
    const samples = data.byteOffset % 4 === 0 ? new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4) : new Float32Array(data.slice().buffer);
    return {samples, video: !!video};
  });
}
export async function decodeAudio(file: File, signal: AbortSignal) {
  // Probe metadata before allocating a decoded buffer; compressed size alone is insufficient.
  const url = URL.createObjectURL(file), audio = new Audio(); audio.preload = 'metadata';
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); audio.onloadedmetadata = null; audio.onerror = null; };
      const fail = (error: Error) => { cleanup(); reject(error); };
      const abort = () => fail(new DOMException('Cancelled', 'AbortError'));
      const timer = setTimeout(() => fail(new Error('Could not read audio duration. Try a WAV file.')), 15000);
      audio.onerror = () => fail(new Error('Your browser cannot decode this format. Try WAV, or enable the optional local media runtime.'));
      audio.onloadedmetadata = () => { cleanup(); resolve(audio.duration); };
      signal.addEventListener('abort', abort, { once: true }); audio.src = url;
      if (signal.aborted) abort();
    });
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_SECONDS) throw new Error('Choose an audio recording up to 2 minutes long.');
    cancelled(signal);
    const context = new AudioContext({sampleRate: SAMPLE_RATE});
    try {
      const decoded = await context.decodeAudioData(await file.arrayBuffer()); cancelled(signal);
      if (decoded.duration > MAX_SECONDS || decoded.numberOfChannels > 2) throw new Error('Use mono or stereo audio up to 2 minutes long.');
      // OfflineAudioContext uses browser band-limited resampling and standard channel downmix.
      const offline = new OfflineAudioContext(1, Math.round(decoded.duration * SAMPLE_RATE), SAMPLE_RATE);
      const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
      const result = await offline.startRendering(); cancelled(signal); return result.getChannelData(0).slice();
    } finally { await context.close(); }
  } finally { audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); }
}
export async function encodeOutput(wav: Blob, original: File | null, kind: 'mp3' | 'video', bitrate: number, manifest: RuntimeManifest, signal: AbortSignal, progress: (n: number) => void) {
  if (![128, 192, 256].includes(bitrate)) throw new Error('Invalid bitrate.');
  return withFFmpeg(manifest, signal, progress, async engine => {
    await engine.writeFile('clean.wav', new Uint8Array(await wav.arrayBuffer())); cancelled(signal);
    let args: string[], output: string, mime: string;
    if (kind === 'video') {
      if (!original) throw new Error('No original video available.');
      const source = `source.${original.name.split('.').pop()!.toLowerCase()}`;
      await engine.writeFile(source, new Uint8Array(await original.arrayBuffer())); cancelled(signal);
      const webm = /\.webm$/i.test(original.name); output = webm ? 'enhanced.webm' : 'enhanced.mp4'; mime = webm ? 'video/webm' : 'video/mp4';
      args = [...inputOptions, '-i', source, ...inputOptions, '-i', 'clean.wav', '-map', '0:V:0', '-map', '1:a:0', '-map_metadata', '0', '-c:v', 'copy', '-c:a', webm ? 'libopus' : 'aac', '-b:a', `${bitrate}k`, ...(webm ? [] : ['-movflags', '+faststart']), output];
    } else { output = 'enhanced.mp3'; mime = 'audio/mpeg'; args = [...inputOptions, '-i', 'clean.wav', '-c:a', 'libmp3lame', '-b:a', `${bitrate}k`, output]; }
    if (await engine.exec(args, 120000)) throw new Error(kind === 'video' ? 'This video cannot be copied into the output container. Download enhanced WAV instead; the video has not been re-encoded.' : 'MP3 encoder unavailable. Download WAV instead.');
    const data = await bytes(engine, output); if (!data.length) throw new Error('Encoder returned an empty file.');
    return {blob: new Blob([data.slice().buffer as ArrayBuffer], {type: mime}), extension: output.split('.').pop()!};
  });
}
