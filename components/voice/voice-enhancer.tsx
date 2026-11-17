"use client";

import { useEffect, useRef, useState } from 'react';
import { AudioLines, Check, Download, LockKeyhole, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadBlob } from '@/lib/download';
import { formatBytes } from '@/lib/files';
import { trackEvent, type AnalyticsProperties } from '@/lib/analytics';
import type { EnhanceAction, EnhanceResult } from '@/lib/voice/adaptive';
import type { RuntimeManifest } from '@/lib/voice/runtime';

type Source = {file: File; samples: Float32Array; peaks: number[]; originalUrl: string; videoUrl?: string; manifest: RuntimeManifest};
type Output = EnhanceResult & {peaks: number[]; url: string};
const actionLabels: Record<EnhanceAction, string> = {
  noise: 'Background noise reduced',
  rumble: 'Low rumble reduced',
  hum: 'Electrical hum reduced',
  clarity: 'Voice clarity adjusted',
  sibilance: 'Sharp S sounds softened',
  volume: 'Voice volume balanced',
  peaks: 'Audio peaks protected',
};
const field = 'mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm';
const accept = '.mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov';
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export default function VoiceEnhancer() {
  const [source, setSource] = useState<Source | null>(null);
  const [output, setOutput] = useState<Output | null>(null);
  const [status, setStatus] = useState<{label: string; value: number | null} | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [track, setTrack] = useState<'original' | 'enhanced'>('original');
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);
  const [bits, setBits] = useState<16 | 24>(24);
  const [bitrate, setBitrate] = useState(192);
  const [videoError, setVideoError] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const player = useRef<HTMLAudioElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const job = useRef<AbortController | null>(null);
  const urls = useRef(new Set<string>());
  const resume = useRef<{time: number; playing: boolean} | null>(null);

  useEffect(() => {
    const ownedUrls = urls.current;
    return () => { job.current?.abort(); ownedUrls.forEach(url => URL.revokeObjectURL(url)); ownedUrls.clear(); };
  }, []);
  useEffect(() => { if (player.current) { player.current.playbackRate = speed; player.current.volume = volume; } }, [speed, volume]);

  function own(blob: Blob) {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  }
  function release(url?: string) {
    if (url && urls.current.delete(url)) URL.revokeObjectURL(url);
  }
  function clearOutput() {
    player.current?.pause();
    resume.current = null;
    release(output?.url);
    setOutput(null);
    setTrack('original');
    setPosition(0);
    if (player.current?.readyState) player.current.currentTime = 0;
  }
  function clearRecording() {
    const activeJob = job.current;
    job.current = null;
    activeJob?.abort();
    video.current?.pause();
    clearOutput();
    release(source?.originalUrl);
    release(source?.videoUrl);
    setSource(null);
    setStatus(null);
    setError('');
    setVideoError(false);
  }
  async function run(operation: 'load' | 'enhance' | 'export', label: string, task: (signal: AbortSignal) => Promise<void>, details: AnalyticsProperties = {}) {
    job.current?.abort();
    const controller = new AbortController();
    job.current = controller;
    setError('');
    setStatus({label, value: null});
    const events = {
      load: ['file_selected', 'file_loaded', 'file_failed', 'file_cancelled'],
      enhance: ['processing_started', 'processing_completed', 'processing_failed', 'processing_cancelled'],
      export: ['export_started', 'export_completed', 'export_failed', 'export_cancelled'],
    } as const;
    const [startedEvent, completedEvent, failedEvent, cancelledEvent] = events[operation];
    const properties = { ...details, operation };
    const started = performance.now();
    trackEvent(startedEvent, properties);
    try {
      await task(controller.signal);
      if (!controller.signal.aborted) trackEvent(completedEvent, { ...properties, elapsed_ms: Math.round(performance.now() - started) });
    }
    catch (err) {
      trackEvent(controller.signal.aborted ? cancelledEvent : failedEvent, { ...properties, elapsed_ms: Math.round(performance.now() - started) });
      if (job.current === controller) setError(controller.signal.aborted ? 'Processing cancelled.' : err instanceof Error ? err.message : 'Processing failed. Try a shorter recording.');
    } finally {
      if (job.current === controller) { job.current = null; setStatus(null); }
    }
  }
  function updateProgress(signal: AbortSignal, value: number | null, label: string) {
    if (!signal.aborted) setStatus({label, value});
  }
  function upload(file?: File) {
    if (!file) return;
    clearRecording();
    void run('load', 'Opening your recording…', async signal => {
      const [{validateFile, isVideo, decodeAudio, extractAudio, cancelled}, {waveform, wavBytes}, {checkRuntime}] = await Promise.all([
        import('@/lib/voice/media'), import('@/lib/voice/dsp'), import('@/lib/voice/runtime'),
      ]);
      validateFile(file);
      const manifest = await checkRuntime(signal);
      let videoInput = isVideo(file);
      let samples: Float32Array;
      const extract = () => extractAudio(file, manifest, signal, value => updateProgress(signal, value, 'Extracting audio…'));
      if (videoInput) {
        updateProgress(signal, null, 'Opening local media decoder…');
        const extracted = await extract();
        samples = extracted.samples;
        videoInput = extracted.video;
      } else {
        try { samples = await decodeAudio(file, signal); }
        catch (err) {
          if (signal.aborted || !manifest.ffmpeg || (err instanceof Error && /2 minutes|mono or stereo/.test(err.message))) throw err;
          updateProgress(signal, null, 'Opening local media decoder…');
          const extracted = await extract();
          samples = extracted.samples;
          videoInput = extracted.video;
        }
      }
      cancelled(signal);
      if (!samples.length) throw new Error('No audio samples were found.');
      const originalUrl = own(new Blob([wavBytes(samples, 24)], {type: 'audio/wav'}));
      setSource({file, samples, peaks: waveform(samples), originalUrl, manifest, videoUrl: videoInput ? own(file) : undefined});
    }, { media_type: file.type.startsWith('video/') ? 'video' : 'audio', file_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100 });
  }
  function enhanceVoice() {
    if (!source || job.current) return;
    player.current?.pause();
    video.current?.pause();
    void run('enhance', 'Analyzing your recording…', async signal => {
      const [{enhance}, {waveform, wavBytes}] = await Promise.all([import('@/lib/voice/client'), import('@/lib/voice/dsp')]);
      if (signal.aborted) throw new Error('Processing cancelled.');
      const result = await enhance(source.samples, source.manifest, signal, (value, label) => updateProgress(signal, value, label));
      if (signal.aborted) throw new Error('Processing cancelled.');
      const url = own(new Blob([wavBytes(result.samples, 24)], {type: 'audio/wav'}));
      clearOutput();
      setOutput({...result, peaks: waveform(result.samples), url});
      setTrack('enhanced');
    }, { duration_seconds: Math.round(source.samples.length / 48000), media_type: source.videoUrl ? 'video' : 'audio' });
  }
  function save(kind: 'wav' | 'mp3' | 'video') {
    if (!output || !source || job.current) return;
    const base = source.file.name.replace(/\.[^.]+$/, '');
    void run('export', 'Preparing download…', async signal => {
      const {wavBytes} = await import('@/lib/voice/dsp');
      if (signal.aborted) throw new Error('Processing cancelled.');
      if (kind === 'wav') {
        downloadBlob(new Blob([wavBytes(output.samples, bits)], {type: 'audio/wav'}), `${base}_enhanced.wav`);
        return;
      }
      const {encodeOutput} = await import('@/lib/voice/media');
      const result = await encodeOutput(new Blob([wavBytes(output.samples, 24)], {type: 'audio/wav'}), source.file, kind, bitrate, source.manifest, signal, value => updateProgress(signal, value, 'Encoding download…'));
      if (signal.aborted) throw new Error('Processing cancelled.');
      downloadBlob(result.blob, `${base}_enhanced.${result.extension}`);
    }, { format: kind, duration_seconds: Math.round(source.samples.length / 48000) });
  }
  function switchTrack(next: 'original' | 'enhanced') {
    const audio = player.current;
    if (!audio || track === next || (next === 'enhanced' && !output)) return;
    resume.current = {time: resume.current?.time ?? audio.currentTime, playing: resume.current?.playing ?? !audio.paused};
    audio.pause();
    setTrack(next);
    trackEvent('comparison_switched', { comparison: next });
  }
  const duration = source ? source.samples.length / 48000 : 0;
  const peaks = track === 'enhanced' && output ? output.peaks : source?.peaks;
  const activeUrl = track === 'enhanced' && output ? output.url : source?.originalUrl;

  return (
    <div className="mt-8 space-y-6">
      <input ref={picker} type="file" accept={accept} tabIndex={-1} className="sr-only" aria-label="Select audio or video file" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      <button ref={uploadButton} type="button" className={`flex w-full flex-col items-center rounded-2xl border border-dashed p-8 text-center transition sm:p-12 ${dragging ? 'border-primary bg-primary/10' : 'border-input bg-card hover:border-primary/50'}`} onClick={() => picker.current?.click()} onDragOver={e => {e.preventDefault(); setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={e => {e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]);}}>
        <Upload aria-hidden className="mb-4 size-7 text-primary" />
        <span className="font-semibold">{source ? 'Replace recording' : 'Drop an audio or video file here'}</span>
        <span className="mt-2 text-sm text-muted-foreground">Browse files · MP3, WAV, M4A, OGG, MP4, MOV or WebM</span>
        <span className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /> Local processing · Up to 40 MB and 2 minutes</span>
      </button>
      {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">{error}</p>}
      {status && <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4">
        <div role="status" className="min-w-48 flex-1 text-sm"><p>{status.label}</p><progress aria-label="Processing progress" className="mt-2 h-2 w-full accent-primary" max={1} value={status.value ?? undefined} /></div>
        <Button variant="outline" onClick={() => job.current?.abort()}>Cancel</Button>
      </div>}
      {source && <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 basis-40">
              <h2 className="break-all font-semibold">{source.file.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{formatBytes(source.file.size)} · {clock(duration)} · 48 kHz mono output</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => {
              trackEvent('file_removed');
              clearRecording();
              uploadButton.current?.focus();
            }}>
              <Trash2 aria-hidden className="size-4" /> Remove file
            </Button>
          </div>
          {source.videoUrl && !videoError && <video ref={video} src={source.videoUrl} controls playsInline preload="metadata" className="max-h-64 w-full rounded-xl bg-black" onPlay={() => player.current?.pause()} onError={() => setVideoError(true)} />}
          {videoError && <p className="text-sm text-muted-foreground">Your browser cannot preview this video codec. Use the audio player below.</p>}
          {output && <div className="flex flex-wrap gap-2" aria-label="Compare audio">
            <Button variant={track === 'original' ? 'default' : 'outline'} aria-pressed={track === 'original'} onClick={() => switchTrack('original')}>A · Original</Button>
            <Button variant={track === 'enhanced' ? 'default' : 'outline'} aria-pressed={track === 'enhanced'} onClick={() => switchTrack('enhanced')}>B · Enhanced</Button>
          </div>}
          <div className="relative h-20 overflow-hidden rounded-xl bg-muted/50">
            <div aria-hidden className="absolute inset-0 flex items-center gap-px px-2">
              {peaks?.map((amplitude, i) => <span key={i} className={`min-w-0 flex-1 rounded-full ${i / peaks.length <= position / duration ? 'bg-primary' : 'bg-muted-foreground/50'}`} style={{height: `${Math.max(4, Math.min(100, Math.sqrt(amplitude) * 100))}%`}} />)}
            </div>
            <input type="range" aria-label="Seek through waveform" aria-valuetext={`${clock(position)} of ${clock(duration)}`} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:opacity-100" min={0} max={duration} step={.01} value={position} onChange={e => {const time = Number(e.target.value); if (player.current) player.current.currentTime = time; setPosition(time);}} />
          </div>
          <audio ref={player} controls src={activeUrl} loop={loop} className="w-full" onPlay={() => video.current?.pause()} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)} onLoadedMetadata={e => {
            const audio = e.currentTarget;
            audio.playbackRate = speed; audio.volume = volume;
            const saved = resume.current;
            resume.current = null;
            if (saved) {audio.currentTime = Math.min(saved.time, audio.duration); if (saved.playing) void audio.play().catch(() => {});}
          }} />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label>Speed <select className="rounded-lg border border-border bg-background p-2" value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[.75, 1, 1.25, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label>
            <label className="flex items-center gap-2">Volume <input type="range" min={0} max={1} step={.05} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-20 accent-primary" /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> Loop</label>
          </div>
        </section>
        <section className="self-start space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-7">
          {!output ? <>
            <h2 className="font-semibold">PicSnips Auto Enhance</h2>
            <p className="text-sm text-muted-foreground">PicSnips checks for background noise and tests which cleanup works best for your recording.</p>
            <Button className="w-full rounded-full" disabled={!!status} onClick={() => enhanceVoice()}><AudioLines className="size-4" /> Auto Enhance</Button>
          </> : <>
            <h2 className="font-semibold">Your recording is ready</h2>
            {output.actions.length ? <ul className="space-y-2 text-sm text-muted-foreground" aria-label="Adjustments applied">
              {output.actions.map(action => <li key={action} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-primary" aria-hidden />{actionLabels[action]}</li>)}
            </ul> : <p className="text-sm text-muted-foreground">The checks found no adjustments to report. Use A/B playback to compare the result.</p>}
            <Button className="w-full rounded-full" disabled={!!status} onClick={() => save(source.videoUrl ? 'video' : 'wav')}><Download className="size-4" /> Download Enhanced File</Button>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Download settings</summary>
              <fieldset disabled={!!status} className="mt-4 space-y-3">
                <label className="block text-sm">WAV quality<select className={field} value={bits} onChange={e => setBits(Number(e.target.value) as 16 | 24)}><option value={16}>16-bit PCM</option><option value={24}>24-bit PCM</option></select></label>
                {source.manifest.ffmpeg && <label className="block text-sm">MP3 / video audio bitrate<select className={field} value={bitrate} onChange={e => setBitrate(Number(e.target.value))}>{[128, 192, 256].map(rate => <option key={rate} value={rate}>{rate} kbps</option>)}</select></label>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => save('wav')}>Download WAV</Button>
                  {source.manifest.ffmpeg && <Button variant="outline" onClick={() => save('mp3')}>Download MP3</Button>}
                </div>
              </fieldset>
            </details>
          </>}
        </section>
      </div>}
    </div>
  );
}
