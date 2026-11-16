import type { EnhanceResult } from './adaptive';
import type { RuntimeManifest } from './runtime';
export function enhance(samples: Float32Array, manifest: RuntimeManifest, signal: AbortSignal, progress: (value: number | null, label: string) => void): Promise<EnhanceResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../workers/voice.worker.ts', import.meta.url), {type: 'module'});
    let timer: ReturnType<typeof setTimeout>;
    const clean = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate(); };
    const fail = (message: string) => { clean(); reject(new Error(message)); };
    const abort = () => fail('Enhancement cancelled.');
    const watchdog = () => { clearTimeout(timer); timer = setTimeout(() => fail('The AI engine stopped responding. Try a shorter clip or another browser.'), 90000); };
    worker.onerror = () => fail('Could not initialize the local AI worker. Check WASM support and installed runtime assets.');
    worker.onmessage = ({data}) => {
      watchdog();
      if (data.type === 'error') fail(data.message);
      else if (data.type === 'done') { clean(); resolve({samples: data.samples, actions: data.actions}); }
      else progress(data.type === 'progress' ? data.value : null, data.label);
    };
    signal.addEventListener('abort', abort, {once: true}); watchdog();
    if (signal.aborted) { abort(); return; }
    // Keep the original for A/B playback; transfer only the worker copy.
    const input = samples.slice(); worker.postMessage({samples: input, manifest}, [input.buffer]);
  });
}
