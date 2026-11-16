import { analyze } from '../lib/voice/diagnostics';
import { choosePlan, choosePreviewPlan, compare, previewRange, renderPlan, validateFinal } from '../lib/voice/adaptive';
import { compensate } from '../lib/voice/dsp';
import { learnNoisePrint, reduceProfileNoise } from '../lib/voice/noise-print';
import type { RuntimeManifest } from '../lib/voice/runtime';

type Filter = { frameLength: number; process(frame: Float32Array): Float32Array; setPostFilterBeta(beta: number): void; destroy(): void };
type FilterRuntime = { DeepFilter: { create(): Promise<Filter> } };
const status = (label: string) => self.postMessage({type: 'status', label});
const postFilterBeta = .05;

async function suppress(runtime: FilterRuntime, samples: Float32Array, manifest: RuntimeManifest, beta = 0, progress?: (fraction: number) => void) {
  const filter = await runtime.DeepFilter.create();
  try {
    if (beta) filter.setPostFilterBeta(beta);
    const size = filter.frameLength;
    if (size !== manifest.frameLength) throw new Error('Unexpected model frame size.');
    const total = Math.ceil((samples.length + manifest.delaySamples) / size);
    const raw = new Float32Array(total * size);
    const frame = new Float32Array(size);
    for (let index = 0; index < total; index++) {
      frame.fill(0);
      frame.set(samples.subarray(index * size, (index + 1) * size));
      const processed = filter.process(frame);
      if (processed.length !== size) throw new Error('Incomplete inference frame.');
      raw.set(processed, index * size);
      if (index % 50 === 0 || index === total - 1) progress?.((index + 1) / total);
    }
    return compensate(raw, samples.length, manifest.delaySamples);
  } finally {
    filter.destroy();
  }
}

self.onmessage = async (event: MessageEvent<{samples: Float32Array; manifest: RuntimeManifest}>) => {
  try {
    const {samples, manifest} = event.data;
    if (!manifest.validated || manifest.frameLength !== 480) throw new Error('Unverified AI runtime.');
    status('Analyzing your recording…');
    const diagnosis = analyze(samples);
    const proposed = choosePlan(diagnosis);
    const {start, end} = previewRange(diagnosis, samples.length);
    const preview = samples.subarray(start, end);
    const previewDiagnosis = analyze(preview);
    const noisePrint = learnNoisePrint(samples, diagnosis);
    let runtime: FilterRuntime | null = null;
    type Method = 'neural' | 'postfilter' | 'profile' | 'cascade';
    const quality = (plan: typeof proposed, wet: Float32Array | null) => {
      const output = renderPlan(preview, wet, plan);
      const score = compare(preview, output.samples, previewDiagnosis);
      return (score.noiseImprovement ?? 0) - 18 * (1 - score.similarity);
    };
    let best: {plan: typeof proposed; wet: Float32Array | null; method: Method; score: number} = {
      plan: choosePreviewPlan(preview, null, proposed, previewDiagnosis), wet: null, method: 'neural', score: 0,
    };
    best.score = quality(best.plan, null);
    function consider(method: Method, wet: Float32Array, strength: number) {
      const plan = choosePreviewPlan(preview, wet, {...proposed, wet: strength}, previewDiagnosis);
      if (!plan.wet) return;
      const score = quality(plan, wet);
      if (score > best.score + .25) best = {plan, wet, method, score};
    }
    if (proposed.wet) {
      status('Loading the local noise remover…');
      const moduleUrl = '/voice-assets/deepfilter/entry.mjs';
      runtime = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ moduleUrl) as FilterRuntime;
      status('Testing a short preview…');
      // Warm up recurrent model state with audio preceding the test excerpt.
      const warmStart = Math.max(0, start - 48000);
      const warmPreview = samples.subarray(warmStart, end);
      consider('neural', (await suppress(runtime, warmPreview, manifest)).subarray(start - warmStart), proposed.wet);
      const stronger = await suppress(runtime, warmPreview, manifest, postFilterBeta);
      consider('postfilter', stronger.subarray(start - warmStart), .99);
      if (noisePrint) {
        const residual = reduceProfileNoise(stronger, noisePrint);
        consider('cascade', residual.subarray(start - warmStart), 1);
      }
    } else {
      status('Testing a short preview…');
    }
    // DeepFilterNet and a measured noise profile have different strengths.
    // For example, the latter can catch a steady fan that the neural pass let through.
    if (noisePrint) {
      status('Checking steady background noise…');
      consider('profile', reduceProfileNoise(preview, noisePrint), .97);
    }
    const {plan, method} = best;
    let wet: Float32Array | null = null;
    if (plan.wet) {
      const progress = (value: number) => self.postMessage({type: 'progress', value, label: 'Reducing background noise…'});
      if (preview.length === samples.length) wet = best.wet;
      else if (method === 'profile' && noisePrint) wet = reduceProfileNoise(samples, noisePrint, progress);
      else if (runtime) {
        const cascade = method === 'cascade' && noisePrint;
        wet = await suppress(runtime, samples, manifest, method === 'neural' ? 0 : postFilterBeta,
          cascade ? value => progress(value * .65) : progress);
        if (cascade) wet = reduceProfileNoise(wet, cascade, value => progress(.65 + value * .35));
      }
    }
    status('Finishing and checking your recording…');
    const result = validateFinal(samples, wet, plan, diagnosis);
    self.postMessage({type: 'done', ...result}, {transfer: [result.samples.buffer]});
  } catch (error) {
    self.postMessage({type: 'error', message: error instanceof Error ? error.message : 'Audio enhancement failed.'});
  }
};
